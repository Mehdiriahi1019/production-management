// components/Files.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFileThunk } from '../../../../features/production/goods/addfile/addfilethunk';
import { clearAddFileStatus } from '../../../../features/production/goods/addfile/addfileslice';
import { deleteFileThunk } from '../../../../features/production/goods/deletefile/deletefilethunk';
import { clearDeleteFileStatus } from '../../../../features/production/goods/deletefile/deletefileslice';
import { updateFileThunk } from '../../../../features/production/goods/updatefile/updatefilethunk';
import { clearUpdateFileStatus } from '../../../../features/production/goods/updatefile/updatefileslice';
import { getGoodsDitailThunk } from '../../../../features/production/goods/goodsditail/goodsditailthunk';

const getAddFileErrorMessage = (err) => {
    if (!err) return 'خطا در آپلود فایل';
    if (typeof err === 'string') return err;
    if (err?.file?.fa) return err.file.fa;
    if (err?.file?.en) return err.file.en;
    if (typeof err?.file === 'string') return err.file;
    if (err?.message?.fa) return err.message.fa;
    if (err?.fa) return err.fa;
    if (err?.detail) return err.detail;
    return 'خطا در آپلود فایل';
};

const getDeleteFileErrorMessage = (err) => {
    if (!err) return 'خطا در حذف فایل';
    if (typeof err === 'string') return err;
    if (err?.message?.fa) return err.message.fa;
    if (err?.fa) return err.fa;
    if (err?.detail) return err.detail;
    return 'خطا در حذف فایل';
};

const getUpdateFileErrorMessage = (err) => {
    if (!err) return 'خطا در به‌روزرسانی فایل';
    if (typeof err === 'string') return err;
    if (err?.message?.fa) return err.message.fa;
    if (err?.fa) return err.fa;
    if (err?.detail) return err.detail;
    return 'خطا در به‌روزرسانی فایل';
};

const Files = ({ id, files }) => {
    const dispatch = useDispatch();
    const { loading: addFileLoading, success: addFileSuccess, error: addFileError } = useSelector((state) => state.addFile);
    const { loading: deleteFileLoading, success: deleteFileSuccess, error: deleteFileError } = useSelector((state) => state.deleteFile);
    const { loading: updateFileLoading, success: updateFileSuccess, error: updateFileError } = useSelector((state) => state.updateFile);
    const [showAddFile, setShowAddFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileTitle, setFileTitle] = useState('');
    const [deletingFileId, setDeletingFileId] = useState(null);
    const [editingFileId, setEditingFileId] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [addMessage, setAddMessage] = useState(null);
    const [deleteMessage, setDeleteMessage] = useState(null);
    const [updateMessage, setUpdateMessage] = useState(null);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    useEffect(() => {
        if (addFileSuccess) {
            setAddMessage({ type: 'success', text: 'فایل با موفقیت آپلود شد' });
            dispatch(getGoodsDitailThunk(id));
            setSelectedFile(null);
            setFileTitle('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setTimeout(() => {
                dispatch(clearAddFileStatus());
                setAddMessage(null);
            }, 4000);
        }
    }, [addFileSuccess, dispatch, id]);

    useEffect(() => {
        if (addFileError) {
            setAddMessage({ type: 'error', text: getAddFileErrorMessage(addFileError) });
            setTimeout(() => {
                setAddMessage(null);
            }, 4000);
        }
    }, [addFileError]);

    useEffect(() => {
        if (deleteFileSuccess) {
            setDeleteMessage({ type: 'success', text: 'فایل با موفقیت حذف شد' });
            dispatch(getGoodsDitailThunk(id));
            setDeletingFileId(null);
            setTimeout(() => {
                dispatch(clearDeleteFileStatus());
                setDeleteMessage(null);
            }, 4000);
        }
    }, [deleteFileSuccess, dispatch, id]);

    useEffect(() => {
        if (deleteFileError) {
            setDeleteMessage({ type: 'error', text: getDeleteFileErrorMessage(deleteFileError) });
            setDeletingFileId(null);
            setTimeout(() => {
                setDeleteMessage(null);
            }, 4000);
        }
    }, [deleteFileError]);

    useEffect(() => {
        if (updateFileSuccess) {
            setUpdateMessage({ type: 'success', text: 'فایل با موفقیت به‌روزرسانی شد' });
            dispatch(getGoodsDitailThunk(id));
            setEditingFileId(null);
            setEditingFile(null);
            setEditingTitle('');
            if (editFileInputRef.current) {
                editFileInputRef.current.value = '';
            }
            setTimeout(() => {
                dispatch(clearUpdateFileStatus());
                setUpdateMessage(null);
            }, 4000);
        }
    }, [updateFileSuccess, dispatch, id]);

    useEffect(() => {
        if (updateFileError) {
            setUpdateMessage({ type: 'error', text: getUpdateFileErrorMessage(updateFileError) });
            setTimeout(() => {
                setUpdateMessage(null);
            }, 4000);
        }
    }, [updateFileError]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (!fileTitle) {
                setFileTitle(file.name.split('.')[0]);
            }
        }
    };

    const handleEditFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditingFile(file);
            if (!editingTitle) {
                setEditingTitle(file.name.split('.')[0]);
            }
        }
    };

    const handleUploadFile = async () => {
        if (!selectedFile) {
            setAddMessage({ type: 'error', text: 'لطفاً یک فایل انتخاب کنید' });
            setTimeout(() => setAddMessage(null), 4000);
            return;
        }

        try {
            await dispatch(addFileThunk({
                id: id,
                file: selectedFile
            })).unwrap();
            setShowAddFile(false);
        } catch (err) {
            console.error('خطا در آپلود فایل:', err);
        }
    };

    const handleUpdateFile = async (fileId) => {
        if (!editingFile) {
            setUpdateMessage({ type: 'error', text: 'لطفاً یک فایل جدید انتخاب کنید' });
            setTimeout(() => setUpdateMessage(null), 4000);
            return;
        }

        // پیدا کردن فایل مورد نظر از لیست files که از دیتیل اومده
        const currentFile = files.find(f => f.id === fileId);

        if (!currentFile) {
            setUpdateMessage({ type: 'error', text: 'فایل مورد نظر یافت نشد' });
            setTimeout(() => setUpdateMessage(null), 4000);
            return;
        }

        try {
            await dispatch(updateFileThunk({
                goodsId: id,
                fileId: fileId,
                payload: {
                    file: editingFile,
                    updated_at: currentFile.updated_at // ← دقیقاً از آبجکت فایل که از سرور اومده
                }
            })).unwrap();
        } catch (err) {
            console.error('خطا در به‌روزرسانی فایل:', err);
        }
    };

    const handleDeleteFile = async (fileId) => {
        setDeletingFileId(fileId);
        try {
            await dispatch(deleteFileThunk({
                goodsId: id,
                fileId: fileId
            })).unwrap();
        } catch (err) {
            console.error('خطا در حذف فایل:', err);
            setDeletingFileId(null);
        }
    };

    const startEditing = (file) => {
        setEditingFileId(file.id);
        setEditingFile(null);
        setEditingTitle(file.title || '');
    };

    const cancelEditing = () => {
        setEditingFileId(null);
        setEditingFile(null);
        setEditingTitle('');
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    // کامپوننت نمایش پیام
    const Message = ({ type, text, onClose }) => {
        if (!text) return null;

        const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';

        return (
            <div className={`flex items-center justify-between p-2 rounded-lg border ${bgColor} mb-2`}>
                <div className="flex items-center gap-2">
                    <i className={`fa-solid ${icon}`} />
                    <span className="text-xs">{text}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                    <i className="fa-solid fa-xmark text-xs" />
                </button>
            </div>
        );
    };

    return (
        <div className="border border-Card_border rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-Card_border pb-2 flex-shrink-0">
                <h4 className="flex items-center gap-2 text-xs font-medium text-Primary">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-Secondary/10 text-Secondary flex-shrink-0">
                        <i className="fa-solid fa-paperclip text-[11px]" />
                    </span>
                    فایل‌های ضمیمه
                </h4>
                <button
                    type="button"
                    onClick={() => setShowAddFile(!showAddFile)}
                    className="flex items-center gap-1 text-xs text-Secondary hover:text-Secondary/80 transition-colors"
                >
                    <i className="fa-solid fa-plus text-[10px]" />
                    افزودن
                </button>
            </div>

            {/* پیام‌ها */}
            {addMessage && (
                <Message
                    type={addMessage.type}
                    text={addMessage.text}
                    onClose={() => setAddMessage(null)}
                />
            )}
            {deleteMessage && (
                <Message
                    type={deleteMessage.type}
                    text={deleteMessage.text}
                    onClose={() => setDeleteMessage(null)}
                />
            )}
            {updateMessage && (
                <Message
                    type={updateMessage.type}
                    text={updateMessage.text}
                    onClose={() => setUpdateMessage(null)}
                />
            )}

            {/* فرم افزودن فایل */}
            {showAddFile && (
                <div className="mb-3 p-3 border border-dashed border-Card_border rounded-lg flex-shrink-0">
                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="text-xs text-Muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-Secondary file:text-white hover:file:bg-Secondary/90"
                            disabled={addFileLoading}
                        />
                        <span className='text-[10px] text-Muted'>فرمت‌های مجاز: PDF، تصاویر، ویدیوها و DXF.</span>
                        {selectedFile && (
                            <p className="text-[10px] text-Muted">
                                فایل انتخاب شده: {selectedFile.name}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="عنوان فایل (اختیاری)"
                                value={fileTitle}
                                onChange={(e) => setFileTitle(e.target.value)}
                                className="flex-1 text-xs rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary text-right outline-none focus:border-Primary/50"
                                disabled={addFileLoading}
                            />
                            <button
                                type="button"
                                onClick={handleUploadFile}
                                disabled={addFileLoading || !selectedFile}
                                className="text-xs bg-Secondary text-white px-3 py-1 rounded-md hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                            >
                                {addFileLoading ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin ml-1" />
                                        در حال آپلود...
                                    </>
                                ) : (
                                    'آپلود'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* لیست فایل‌ها */}
            <div>
                {files && files.length > 0 ? (
                    <div className="space-y-2">
                        {files.map((file) => {
                            const isVideo = file.file_type === 'mp4';
                            const isImage = ['jpg', 'jpeg', 'png'].includes(file.file_type);
                            const isDeleting = deletingFileId === file.id && deleteFileLoading;
                            const isEditing = editingFileId === file.id;
                            const isUpdating = editingFileId === file.id && updateFileLoading;

                            return (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border border-Card_border hover:bg-Input_bg hover:shadow-sm transition-all ${isDeleting || isUpdating ? 'opacity-50' : ''
                                        }`}
                                >
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${isVideo
                                            ? 'bg-blue-100 text-blue-500'
                                            : isImage
                                                ? 'bg-green-100 text-green-500'
                                                : 'bg-Input_bg text-Muted'
                                        }`}>
                                        <i className={`text-sm ${isVideo
                                                ? 'fa-solid fa-file-video'
                                                : isImage
                                                    ? 'fa-solid fa-file-image'
                                                    : 'fa-solid fa-file'
                                            }`} />
                                    </span>

                                    {isEditing ? (
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={editFileInputRef}
                                                    type="file"
                                                    onChange={handleEditFileSelect}
                                                    className="text-xs text-Muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-Secondary file:text-white hover:file:bg-Secondary/90"
                                                    disabled={updateFileLoading}
                                                />
                                                {editingFile && (
                                                    <span className="text-[10px] text-Muted">
                                                        {editingFile.name}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="عنوان فایل"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="w-full text-xs rounded-md border border-Card_border bg-Input_bg/40 px-2 py-1 text-Primary text-right outline-none focus:border-Primary/50"
                                                disabled={updateFileLoading}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateFile(file.id)}
                                                    disabled={updateFileLoading || !editingFile}
                                                    className="text-xs bg-Secondary text-white px-2 py-1 rounded-md hover:bg-Secondary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {updateFileLoading ? (
                                                        <>
                                                            <i className="fa-solid fa-spinner fa-spin ml-1" />
                                                            در حال ذخیره...
                                                        </>
                                                    ) : (
                                                        'ذخیره'
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    disabled={updateFileLoading}
                                                    className="text-xs border border-Card_border px-2 py-1 rounded-md text-Muted hover:bg-Input_bg transition-colors disabled:opacity-50"
                                                >
                                                    انصراف
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0 text-right">
                                                <p className="text-xs text-Primary truncate">
                                                    {file.title || file.file_type || "فایل"}
                                                </p>
                                                <p className="text-[10px] text-Muted">
                                                    {file.file_type?.toUpperCase() || "—"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(file)}
                                                    disabled={isDeleting}
                                                    className="flex items-center justify-center w-6 h-6 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                    title="ویرایش فایل"
                                                >
                                                    <i className="fa-solid fa-pen text-xs" />
                                                </button>
                                                <a
                                                    href={file.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-6 h-6 rounded-md text-Muted hover:text-Primary hover:bg-Input_bg transition-colors"
                                                >
                                                    <i className="fa-solid fa-eye text-xs" />
                                                </a>
                                                <a
                                                    href={file.file}
                                                    download
                                                    className="flex items-center justify-center w-6 h-6 rounded-md text-Muted hover:text-Primary hover:bg-Input_bg transition-colors"
                                                >
                                                    <i className="fa-solid fa-download text-xs" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    disabled={isDeleting}
                                                    className="flex items-center justify-center w-6 h-6 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    title="حذف فایل"
                                                >
                                                    {isDeleting ? (
                                                        <i className="fa-solid fa-spinner fa-spin text-xs" />
                                                    ) : (
                                                        <i className="fa-solid fa-trash-can text-xs" />
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                        <i className="fa-solid fa-inbox text-Muted/50 text-lg" />
                        <span className="text-xs text-Muted">هیچ فایلی وجود ندارد</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Files;