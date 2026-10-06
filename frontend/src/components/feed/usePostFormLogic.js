import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useFeed from '../../hooks/useFeed';



// GETS A SAFE URL FOR THE IMAGE PREVIEW
function getSafePreviewUrl(url) {
  if (typeof url !== 'string') return null;
  return url.startsWith('blob:') ? url : null;
}



// CUSTOM HOOK THAT CLEANS UP THE PREVIEW URL WHEN UNMOUNTING
function useCleanupPreview(url) {
  useEffect(() => {
    return () => { if (url) { try { URL.revokeObjectURL(url); } catch (_) { } } };
  }, [url]);
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
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  useCleanupPreview(previewUrl);



  // SUBMITS THE POST DATA AND FILE TO THE SERVER
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting || processing) return;
    setSubmitting(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("description", (description || '').trim());
        formData.append("type", "image");
        await createPostWithFile(formData);
      } else {
        await createPost({ description, type: 'text', authorId: auth._id });
      }
      setDescription('');
      setFile(null);
      setExpanded(false);
      if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { }; setPreviewUrl(null); }
      if (e.target?.reset) e.target.reset();
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



  // HANDLES THE SELECTION OF A FILE FOR THE POST.
  // MOBILE PHOTOS ARE HUGE (8-30MB) AND iPHONES SHOOT HEIC: THE SERVER ONLY
  // ACCEPTS JPEG/PNG/GIF/WEBP, SO WE DOWNSCALE + RE-ENCODE CLIENT-SIDE.
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (toast) setToast('');
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { } }
    if (!f) { setFile(null); setPreviewUrl(null); return; }

    const name = (f.name || '').toLowerCase();
    const isHeic = f.type === 'image/heic' || f.type === 'image/heif'
      || name.endsWith('.heic') || name.endsWith('.heif');
    if (!f.type?.startsWith('image/')) {
      setToast('Solo se permiten imágenes (JPG, PNG, GIF, WebP).');
      setFile(null); setPreviewUrl(null); e.target.value = '';
      return;
    }

    const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
    if (f.size > MAX_IMAGE_SIZE) {
      setToast('La imagen no puede superar 15 MB.');
      setFile(null); setPreviewUrl(null); e.target.value = '';
      return;
    }

    // Intentar comprimir (también convierte HEIC→JPEG si el navegador lo decodifica,
    // como Safari). Si falla y es HEIC, avisar con la solución.
    setProcessing(true);
    try {
      const out = await compressImage(f);
      setFile(out);
      try { setPreviewUrl(URL.createObjectURL(out)); } catch (_) { setPreviewUrl(null); }
      setExpanded(true);
    } catch (_) {
      if (isHeic) {
        setToast('Tu iPhone guarda fotos en HEIC, no soportado. Ve a Ajustes > Cámara > Formatos > Más compatible y reintenta.');
      } else {
        setToast('No se pudo procesar la imagen. Prueba con otra foto.');
      }
      setFile(null); setPreviewUrl(null); e.target.value = '';
    } finally {
      setProcessing(false);
    }
  };



  // DISCARDS THE CURRENT POST CONTENT AND FILE
  const handleDiscard = (e) => {
    e.preventDefault();
    setDescription('');
    setFile(null);
    setExpanded(false);
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { }; setPreviewUrl(null); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  // COMPUTES THE DISPLAY NAME OF THE CURRENT USER
  const displayName = auth ? `${auth.firstName || ''}`.trim() || auth.username || 'Tú' : 'Tú';
  const firstName = displayName.split(' ')[0];
  const hasContent = file || description.trim().length > 0;
  const safePreviewUrl = getSafePreviewUrl(previewUrl);


  return {
    navigate, description, setDescription, file, previewUrl, toast, setToast,
    expanded, setExpanded, submitting, processing, textareaRef, fileInputRef,
    onSubmit, handleFileChange,
    handleDiscard, firstName, hasContent, safePreviewUrl
  };
}
