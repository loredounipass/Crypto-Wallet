import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFeed from '../../hooks/useFeed';



// CUSTOM HOOK THAT CLEANS UP THE PREVIEW URLS WHEN UNMOUNTING
function useCleanupPreviews(urls) {
  useEffect(() => {
    return () => {
      for (const url of urls) {
        if (url) { try { URL.revokeObjectURL(url); } catch (_) { } }
      }
    };
  }, [urls]);
}



// COMPRESSES A LARGE PHOTO CLIENT-SIDE SO MOBILE UPLOADS DON'T TIME OUT.
// DOWNSCALES TO maxDim PX AND RE-ENCODES AS JPEG. GIFS KEEP ANIMATION (NO TOUCH).
function compressImage(file, maxDim = 1280, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') return resolve(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        // Si ya es pequeña, devolver original (evita recomprimir de más)
        if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
          URL.revokeObjectURL(url);
          return resolve(file);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return resolve(file);
          const base = (file.name || 'foto').replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${base}.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode-error'));
    };
    img.src = url;
  });
}


// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE POST FORM
export default function usePostFormLogic(auth) {
  const navigate = useNavigate();
  const { createPostWithFile, createPost } = useFeed();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [toast, setToast] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  useCleanupPreviews(previews);

  const MAX_FILES = 10;



  // SUBMITS THE POST DATA AND FILES TO THE SERVER
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting || processing) return;
    setSubmitting(true);
    try {
      let created = null;
      if (files.length > 0) {
        const formData = new FormData();
        for (const f of files) formData.append('files', f);
        formData.append('description', (description || '').trim());
        formData.append('type', 'image');
        created = await createPostWithFile(formData);
      } else {
        created = await createPost({ description, type: 'text', authorId: auth._id });
      }
      clearFiles();
      setDescription('');
      setExpanded(false);
      if (e.target?.reset) e.target.reset();
      if (typeof onCreated === 'function') {
        try { await onCreated(created); } catch (_) { }
      }
    } catch (err) {
      console.error(err);
      if (!err?.response) {
        setToast(`Sin conexión al servidor [${err?.code || 'sin-respuesta'}]. Revisa tu internet e inténtalo de nuevo.`);
      } else {
        setToast(err?.response?.data?.message || err?.message || 'Error creando el post');
      }
    } finally {
      setSubmitting(false);
    }
  };



  // CLEARS ALL SELECTED FILES AND THEIR PREVIEWS
  const clearFiles = () => {
    for (const u of previews) { try { URL.revokeObjectURL(u); } catch (_) { } }
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // REMOVES ONE PHOTO BY INDEX
  const removeFile = (idx) => {
    const url = previews[idx];
    if (url) { try { URL.revokeObjectURL(url); } catch (_) { } }
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (files.length <= 1 && fileInputRef.current) fileInputRef.current.value = '';
  };


  // HANDLES THE SELECTION OF FILES FOR THE POST (UP TO 10 PHOTOS).
  // MOBILE PHOTOS ARE HUGE (8-30MB) AND iPHONES SHOOT HEIC: THE SERVER ONLY
  // ACCEPTS JPEG/PNG/GIF/WEBP, SO WE DOWNSCALE + RE-ENCODE CLIENT-SIDE.
  const handleFileChange = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (toast) setToast('');
    if (picked.length === 0) return;

    const room = MAX_FILES - files.length;
    if (room <= 0) {
      setToast(`Máximo ${MAX_FILES} fotos por publicación.`);
      e.target.value = '';
      return;
    }
    const batch = picked.slice(0, room);
    if (picked.length > room) setToast(`Solo se agregaron ${room} (máximo ${MAX_FILES}).`);

    const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
    const valid = [];
    for (const f of batch) {
      const name = (f.name || '').toLowerCase();
      const isHeic = f.type === 'image/heic' || f.type === 'image/heif'
        || name.endsWith('.heic') || name.endsWith('.heif');
      if (!f.type?.startsWith('image/')) {
        setToast('Solo se permiten imágenes (JPG, PNG, GIF, WebP).');
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        setToast(`"${f.name}" supera 15 MB y se omitió.`);
        continue;
      }
      if (isHeic) {
        setToast('HEIC no soportado: usa Ajustes > Cámara > Formatos > Más compatible.');
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) { e.target.value = ''; return; }

    // Intentar comprimir cada foto (GIFs se dejan intactos dentro de compressImage)
    setProcessing(true);
    try {
      const out = [];
      for (const f of valid) {
        try {
          out.push(await compressImage(f));
        } catch (_) {
          setToast(`No se pudo procesar "${f.name}".`);
        }
      }
      if (out.length === 0) { e.target.value = ''; return; }
      const urls = out.map((f) => { try { return URL.createObjectURL(f); } catch (_) { return null; } });
      setFiles((prev) => [...prev, ...out]);
      setPreviews((prev) => [...prev, ...urls]);
      setExpanded(true);
    } finally {
      setProcessing(false);
      e.target.value = '';
    }
  };



  // DISCARDS THE CURRENT POST CONTENT AND FILES
  const handleDiscard = (e) => {
    e.preventDefault();
    setDescription('');
    clearFiles();
    setExpanded(false);
  };



  // COMPUTES THE DISPLAY NAME OF THE CURRENT USER
  const displayName = auth ? `${auth.firstName || ''}`.trim() || auth.username || 'Tú' : 'Tú';
  const firstName = displayName.split(' ')[0];
  const hasContent = files.length > 0 || description.trim().length > 0;


  return {
    navigate, description, setDescription, files, previews, toast, setToast,
    expanded, setExpanded, submitting, processing, textareaRef, fileInputRef,
    onSubmit, handleFileChange, removeFile, clearFiles, MAX_FILES,
    handleDiscard, firstName, hasContent
  };
}
