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
  const textareaRef = useRef(null);
  useCleanupPreview(previewUrl);



  // SUBMITS THE POST DATA AND FILE TO THE SERVER
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
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
      setToast(err?.response?.data?.message || err?.message || 'Error creando el post');
    } finally {
      setSubmitting(false);
    }
  };



  // HANDLES THE SELECTION OF A FILE FOR THE POST
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (toast) setToast('');
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { } }
    if (!f) { setFile(null); setPreviewUrl(null); return; }

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

    setFile(f);
    try { setPreviewUrl(URL.createObjectURL(f)); } catch (_) { setPreviewUrl(null); }
    setExpanded(true);
  };



  // DISCARDS THE CURRENT POST CONTENT AND FILE
  const handleDiscard = (e) => {
    e.preventDefault();
    setDescription('');
    setFile(null);
    setExpanded(false);
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (_) { }; setPreviewUrl(null); }
    const input = document.getElementById('post-file-input');
    if (input) input.value = '';
  };



  // COMPUTES THE DISPLAY NAME OF THE CURRENT USER
  const displayName = auth ? `${auth.firstName || ''}`.trim() || auth.username || 'Tú' : 'Tú';
  const firstName = displayName.split(' ')[0];
  const hasContent = file || description.trim().length > 0;
  const safePreviewUrl = getSafePreviewUrl(previewUrl);


  return {
    navigate, description, setDescription, file, previewUrl, toast, setToast,
    expanded, setExpanded, submitting, textareaRef, onSubmit, handleFileChange,
    handleDiscard, firstName, hasContent, safePreviewUrl
  };
}
