// components/CreateProductionOrderModal.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { getGoodsForSelectThunk } from '../../features/production/goods/goodsforselect/goodsforselectthunk';
import { getOrderTypeThunk } from '../../features/production/productionorder/ordertype/ordertypethunk';
import { createOrderThunk } from '../../features/production/productionorder/createorder/createorderthunk';
import { clearCreateOrderState } from '../../features/production/productionorder/createorder/createorderslice';
import { getPaintsForSelectThunk } from '../../features/production/paints/paintsforselect/paintsforselectthunk';
import { getSheetsForSelectThunk } from '../../features/production/sheets/sheetsforselect/sheetsforselectthunk';

// ======== کامپوننت جستجوی کالا با استایل مشابه UserSearchablePermissionSelect ========
const GoodsSearchableSelect = ({
    selectedGoods = [],
    onChange,
    disabled,
    initialGoods = []
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [allGoods, setAllGoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 360 });
    const [goodsCache, setGoodsCache] = useState(() => {
        const cache = {};
        initialGoods.forEach((g) => {
            if (g?.id) cache[g.id] = g;
        });
        return cache;
    });

    const containerRef = useRef(null);
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const PER_PAGE = 20;
    const ESTIMATED_PANEL_HEIGHT = 420;
    const VIEWPORT_MARGIN = 8;

    const normalizedSelected = useMemo(
        () => selectedGoods.map((id) => String(id)),
        [selectedGoods]
    );
    const isGoodsSelected = (id) => normalizedSelected.includes(String(id));

    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
        const spaceAbove = rect.top - VIEWPORT_MARGIN;
        const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
        const maxHeight = Math.max(160, Math.min(360, (openUp ? spaceAbove : spaceBelow)));

        setCoords({
            top: openUp ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width,
            openUp,
            maxHeight,
        });
    };

    const loadGoods = async (search = '', page = 1) => {
        setLoading(true);
        try {
            const params = {
                limit: PER_PAGE,
                offset: (page - 1) * PER_PAGE,
            };
            if (search.trim()) {
                params.search = search.trim();
            }

            const result = await dispatch(getGoodsForSelectThunk(params)).unwrap();

            let items = [];
            let count = 0;

            if (result?.data && Array.isArray(result.data)) {
                items = result.data;
                if (result?.meta && typeof result.meta.count === 'number') {
                    count = result.meta.count;
                } else {
                    count = result.data.length;
                }
            } else if (Array.isArray(result)) {
                items = result;
                count = result.length;
            } else if (result?.results && Array.isArray(result.results)) {
                items = result.results;
                count = result.count || result.results.length;
            }

            setAllGoods(items);
            setTotalCount(count);

            setGoodsCache((prev) => {
                const next = { ...prev };
                items.forEach((g) => {
                    if (g?.id) next[g.id] = g;
                });
                return next;
            });
        } catch (error) {
            console.error('خطا در دریافت کالاها:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGoods('', 1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            loadGoods(searchTerm, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

    const goToPage = (page) => {
        if (page < 1 || page > totalPages || loading) return;
        setCurrentPage(page);
        loadGoods(searchTerm, page);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedContainer = containerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedContainer && !clickedPanel) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handle = () => updateCoords();
        window.addEventListener('scroll', handle, true);
        window.addEventListener('resize', handle);
        return () => {
            window.removeEventListener('scroll', handle, true);
            window.removeEventListener('resize', handle);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setPanelVisible(true));
            return () => cancelAnimationFrame(raf);
        } else {
            setPanelVisible(false);
        }
    }, [isOpen]);

    const selectedGoodsDetails = useMemo(() => {
        return normalizedSelected
            .map((id) => goodsCache[id])
            .filter(Boolean);
    }, [normalizedSelected, goodsCache]);

    const handleToggleGoods = (goodsId) => {
        const idStr = String(goodsId);
        if (normalizedSelected.includes(idStr)) {
            onChange(selectedGoods.filter((id) => String(id) !== idStr));
        } else {
            onChange([...selectedGoods, idStr]);
        }
        setIsOpen(false);
    };

    const handleRemoveGoods = (e, goodsId) => {
        e.stopPropagation();
        const idStr = String(goodsId);
        onChange(selectedGoods.filter((id) => String(id) !== idStr));
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        onChange([]);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            updateCoords();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const renderGoodsRow = (goods, isSelected) => {
        const title = goods.display_name || goods.name || goods.sn_code || "بدون عنوان";
        const code = goods.sn_code || goods.code || "";

        return (
            <button
                key={goods.id}
                type="button"
                onClick={() => handleToggleGoods(goods.id)}
                className={`w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 mx-1 my-0.5 rounded-lg transition-all duration-150 ${
                    isSelected
                        ? "bg-Secondary/10 text-Secondary"
                        : "text-Primary hover:bg-Input_bg hover:translate-x-[-1px]"
                }`}
                style={{ width: 'calc(100% - 8px)' }}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] flex-shrink-0 transition-all duration-150 ${
                            isSelected
                                ? "bg-Secondary border-Secondary text-white scale-100"
                                : "border-Card_border scale-95"
                        }`}
                    >
                        <i
                            className={`fas fa-check transition-all duration-150 ${
                                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                            }`}
                        />
                    </span>
                    <span className="truncate">{title}</span>
                </div>
                {code && (
                    <span
                        dir="ltr"
                        className="text-Muted text-[10px] flex-shrink-0 bg-Input_bg/60 px-1.5 py-0.5 rounded-md"
                    >
                        {code}
                    </span>
                )}
            </button>
        );
    };

    const panel = isOpen && !disabled ? createPortal(
        <div
            ref={panelRef}
            dir="rtl"
            style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + 6,
                bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                zIndex: 9999,
                opacity: panelVisible ? 1 : 0,
                transform: panelVisible
                    ? 'translateY(0) scale(1)'
                    : `translateY(${coords.openUp ? 6 : -6}px) scale(0.98)`,
                transition: 'opacity 160ms ease, transform 160ms ease',
            }}
            className="rounded-2xl border border-Card_border bg-Background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 bg-gradient-to-l from-Secondary/15 via-Secondary/5 to-transparent border-b border-Card_border flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] font-medium text-Secondary flex items-center gap-1.5">
                    <i className="fas fa-box text-[10px]" />
                    انتخاب کالاها
                </span>
                {totalCount > 0 && (
                    <span className="text-[10px] text-Muted">
                        {totalCount.toLocaleString("fa-IR")} مورد
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-1">
                {selectedGoodsDetails.length > 0 && (
                    <div className="mb-1">
                        <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-Secondary flex items-center gap-1">
                                <i className="fas fa-check-double text-[9px]" />
                                انتخاب شده ({selectedGoodsDetails.length.toLocaleString("fa-IR")})
                            </span>
                        </div>
                        {selectedGoodsDetails.map((goods) =>
                            renderGoodsRow(goods, true)
                        )}
                        <div className="border-t border-Card_border my-1 mx-2" />
                    </div>
                )}

                {loading && allGoods.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-Secondary" />
                        در حال بارگذاری...
                    </div>
                ) : allGoods.length === 0 && selectedGoodsDetails.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-inbox text-lg opacity-40" />
                        کالایی یافت نشد
                    </div>
                ) : (
                    allGoods.map((goods) => {
                        if (isGoodsSelected(goods.id)) return null;
                        return renderGoodsRow(goods, false);
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-Card_border bg-Input_bg/40 flex-shrink-0">
                    <span className="text-[10px] text-Muted">
                        صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-right text-[10px]" />
                        </button>

                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => goToPage(page)}
                                disabled={loading}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-medium transition-all duration-150 ${
                                    currentPage === page
                                        ? "bg-gradient-to-br from-Secondary to-Secondary/80 text-white shadow-sm shadow-Secondary/40"
                                        : "text-Primary hover:bg-Background"
                                }`}
                            >
                                {page.toLocaleString("fa-IR")}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-left text-[10px]" />
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative" ref={containerRef}>
                <div
                    className={`bg-Input_bg border rounded-lg px-3 py-2 text-sm text-Primary cursor-text transition-all duration-150 ${
                        isOpen ? "border-Secondary ring-2 ring-Secondary/20" : "border-Card_border"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={toggleDropdown}
                >
                    <div className="flex items-center gap-2">
                        <i className="fas fa-magnifying-glass text-[11px] text-Muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="جستجوی کالا..."
                            value={isOpen ? searchTerm : ""}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => !disabled && setIsOpen(true)}
                            disabled={disabled}
                            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0 truncate"
                            dir="rtl"
                        />
                        {selectedGoods.length > 0 && !isOpen && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-white bg-gradient-to-br from-Secondary to-Secondary/80 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {selectedGoods.length.toLocaleString("fa-IR")}
                            </span>
                        )}
                        {selectedGoods.length > 0 && !isOpen && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={disabled}
                                className="flex-shrink-0 text-Muted hover:text-red-500 transition-colors"
                                title="پاک کردن همه"
                            >
                                <i className="fas fa-times text-xs" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={toggleDropdown}
                            disabled={disabled}
                            className="flex-shrink-0 text-Muted hover:text-Secondary transition-colors"
                        >
                            <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] transition-transform`} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedGoodsDetails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedGoodsDetails.map((goods) => {
                        const title = goods.display_name || goods.name || goods.sn_code || "بدون عنوان";
                        return (
                            <span
                                key={goods.id}
                                className="inline-flex items-center gap-1.5 max-w-full bg-Secondary/10 text-Secondary text-[11px] pl-1.5 pr-2.5 py-1 rounded-full"
                            >
                                <span className="truncate max-w-[160px]">{title}</span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemoveGoods(e, goods.id)}
                                    disabled={disabled}
                                    className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-Secondary hover:text-white transition-colors disabled:pointer-events-none"
                                >
                                    <i className="fas fa-times text-[8px]" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {panel}
        </div>
    );
};

// ======== کامپوننت جستجوی رنگ با استایل مشابه (با سرچ و پیجینیشن) ========
const PaintSearchableSelect = ({
    selectedPaints = [],
    onChange,
    disabled,
    initialPaints = []
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [allPaints, setAllPaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 360 });
    const [paintsCache, setPaintsCache] = useState(() => {
        const cache = {};
        initialPaints.forEach((p) => {
            if (p?.id) cache[p.id] = p;
        });
        return cache;
    });

    const containerRef = useRef(null);
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const PER_PAGE = 20;
    const ESTIMATED_PANEL_HEIGHT = 420;
    const VIEWPORT_MARGIN = 8;

    const normalizedSelected = useMemo(
        () => selectedPaints.map((id) => String(id)),
        [selectedPaints]
    );
    const isPaintSelected = (id) => normalizedSelected.includes(String(id));

    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
        const spaceAbove = rect.top - VIEWPORT_MARGIN;
        const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
        const maxHeight = Math.max(160, Math.min(360, (openUp ? spaceAbove : spaceBelow)));

        setCoords({
            top: openUp ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width,
            openUp,
            maxHeight,
        });
    };

    const loadPaints = async (search = '', page = 1) => {
        setLoading(true);
        try {
            const params = {
                limit: PER_PAGE,
                offset: (page - 1) * PER_PAGE,
            };
            if (search.trim()) {
                params.search = search.trim();
            }

            const result = await dispatch(getPaintsForSelectThunk(params)).unwrap();

            let items = [];
            let count = 0;

            if (result?.data && Array.isArray(result.data)) {
                items = result.data;
                if (result?.meta && typeof result.meta.count === 'number') {
                    count = result.meta.count;
                } else {
                    count = result.data.length;
                }
            } else if (Array.isArray(result)) {
                items = result;
                count = result.length;
            } else if (result?.results && Array.isArray(result.results)) {
                items = result.results;
                count = result.count || result.results.length;
            }

            setAllPaints(items);
            setTotalCount(count);

            setPaintsCache((prev) => {
                const next = { ...prev };
                items.forEach((p) => {
                    if (p?.id) next[p.id] = p;
                });
                return next;
            });
        } catch (error) {
            console.error('خطا در دریافت رنگ‌ها:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPaints('', 1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            loadPaints(searchTerm, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

    const goToPage = (page) => {
        if (page < 1 || page > totalPages || loading) return;
        setCurrentPage(page);
        loadPaints(searchTerm, page);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedContainer = containerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedContainer && !clickedPanel) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handle = () => updateCoords();
        window.addEventListener('scroll', handle, true);
        window.addEventListener('resize', handle);
        return () => {
            window.removeEventListener('scroll', handle, true);
            window.removeEventListener('resize', handle);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setPanelVisible(true));
            return () => cancelAnimationFrame(raf);
        } else {
            setPanelVisible(false);
        }
    }, [isOpen]);

    const selectedPaintsDetails = useMemo(() => {
        return normalizedSelected
            .map((id) => paintsCache[id])
            .filter(Boolean);
    }, [normalizedSelected, paintsCache]);

    const handleTogglePaint = (paintId) => {
        const idStr = String(paintId);
        if (normalizedSelected.includes(idStr)) {
            onChange(selectedPaints.filter((id) => String(id) !== idStr));
        } else {
            onChange([...selectedPaints, idStr]);
        }
        setIsOpen(false);
    };

    const handleRemovePaint = (e, paintId) => {
        e.stopPropagation();
        const idStr = String(paintId);
        onChange(selectedPaints.filter((id) => String(id) !== idStr));
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        onChange([]);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            updateCoords();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const renderPaintRow = (paint, isSelected) => {
        const title = paint.display_name || paint.name || paint.code || "بدون عنوان";
        const code = paint.code || "";

        return (
            <button
                key={paint.id}
                type="button"
                onClick={() => handleTogglePaint(paint.id)}
                className={`w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 mx-1 my-0.5 rounded-lg transition-all duration-150 ${
                    isSelected
                        ? "bg-Secondary/10 text-Secondary"
                        : "text-Primary hover:bg-Input_bg hover:translate-x-[-1px]"
                }`}
                style={{ width: 'calc(100% - 8px)' }}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] flex-shrink-0 transition-all duration-150 ${
                            isSelected
                                ? "bg-Secondary border-Secondary text-white scale-100"
                                : "border-Card_border scale-95"
                        }`}
                    >
                        <i
                            className={`fas fa-check transition-all duration-150 ${
                                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                            }`}
                        />
                    </span>
                    <span className="truncate">{title}</span>
                </div>
                {code && (
                    <span
                        dir="ltr"
                        className="text-Muted text-[10px] flex-shrink-0 bg-Input_bg/60 px-1.5 py-0.5 rounded-md"
                    >
                        {code}
                    </span>
                )}
            </button>
        );
    };

    const panel = isOpen && !disabled ? createPortal(
        <div
            ref={panelRef}
            dir="rtl"
            style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + 6,
                bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                zIndex: 9999,
                opacity: panelVisible ? 1 : 0,
                transform: panelVisible
                    ? 'translateY(0) scale(1)'
                    : `translateY(${coords.openUp ? 6 : -6}px) scale(0.98)`,
                transition: 'opacity 160ms ease, transform 160ms ease',
            }}
            className="rounded-2xl border border-Card_border bg-Background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 bg-gradient-to-l from-Secondary/15 via-Secondary/5 to-transparent border-b border-Card_border flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] font-medium text-Secondary flex items-center gap-1.5">
                    <i className="fas fa-palette text-[10px]" />
                    انتخاب رنگ‌ها
                </span>
                {totalCount > 0 && (
                    <span className="text-[10px] text-Muted">
                        {totalCount.toLocaleString("fa-IR")} مورد
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-1">
                {selectedPaintsDetails.length > 0 && (
                    <div className="mb-1">
                        <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-Secondary flex items-center gap-1">
                                <i className="fas fa-check-double text-[9px]" />
                                انتخاب شده ({selectedPaintsDetails.length.toLocaleString("fa-IR")})
                            </span>
                        </div>
                        {selectedPaintsDetails.map((paint) =>
                            renderPaintRow(paint, true)
                        )}
                        <div className="border-t border-Card_border my-1 mx-2" />
                    </div>
                )}

                {loading && allPaints.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-Secondary" />
                        در حال بارگذاری...
                    </div>
                ) : allPaints.length === 0 && selectedPaintsDetails.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-inbox text-lg opacity-40" />
                        رنگی یافت نشد
                    </div>
                ) : (
                    allPaints.map((paint) => {
                        if (isPaintSelected(paint.id)) return null;
                        return renderPaintRow(paint, false);
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-Card_border bg-Input_bg/40 flex-shrink-0">
                    <span className="text-[10px] text-Muted">
                        صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-right text-[10px]" />
                        </button>

                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => goToPage(page)}
                                disabled={loading}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-medium transition-all duration-150 ${
                                    currentPage === page
                                        ? "bg-gradient-to-br from-Secondary to-Secondary/80 text-white shadow-sm shadow-Secondary/40"
                                        : "text-Primary hover:bg-Background"
                                }`}
                            >
                                {page.toLocaleString("fa-IR")}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-left text-[10px]" />
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative" ref={containerRef}>
                <div
                    className={`bg-Input_bg border rounded-lg px-3 py-2 text-sm text-Primary cursor-text transition-all duration-150 ${
                        isOpen ? "border-Secondary ring-2 ring-Secondary/20" : "border-Card_border"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={toggleDropdown}
                >
                    <div className="flex items-center gap-2">
                        <i className="fas fa-magnifying-glass text-[11px] text-Muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="جستجوی رنگ..."
                            value={isOpen ? searchTerm : ""}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => !disabled && setIsOpen(true)}
                            disabled={disabled}
                            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0 truncate"
                            dir="rtl"
                        />
                        {selectedPaints.length > 0 && !isOpen && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-white bg-gradient-to-br from-Secondary to-Secondary/80 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {selectedPaints.length.toLocaleString("fa-IR")}
                            </span>
                        )}
                        {selectedPaints.length > 0 && !isOpen && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={disabled}
                                className="flex-shrink-0 text-Muted hover:text-red-500 transition-colors"
                                title="پاک کردن همه"
                            >
                                <i className="fas fa-times text-xs" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={toggleDropdown}
                            disabled={disabled}
                            className="flex-shrink-0 text-Muted hover:text-Secondary transition-colors"
                        >
                            <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] transition-transform`} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedPaintsDetails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedPaintsDetails.map((paint) => {
                        const title = paint.display_name || paint.name || paint.code || "بدون عنوان";
                        return (
                            <span
                                key={paint.id}
                                className="inline-flex items-center gap-1.5 max-w-full bg-Secondary/10 text-Secondary text-[11px] pl-1.5 pr-2.5 py-1 rounded-full"
                            >
                                <span className="truncate max-w-[160px]">{title}</span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemovePaint(e, paint.id)}
                                    disabled={disabled}
                                    className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-Secondary hover:text-white transition-colors disabled:pointer-events-none"
                                >
                                    <i className="fas fa-times text-[8px]" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {panel}
        </div>
    );
};

// ======== کامپوننت جستجوی ورق با استایل مشابه (با سرچ و پیجینیشن) ========
const SheetSearchableSelect = ({
    selectedSheets = [],
    onChange,
    disabled,
    initialSheets = []
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [allSheets, setAllSheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 360 });
    const [sheetsCache, setSheetsCache] = useState(() => {
        const cache = {};
        initialSheets.forEach((s) => {
            if (s?.id) cache[s.id] = s;
        });
        return cache;
    });

    const containerRef = useRef(null);
    const panelRef = useRef(null);
    const inputRef = useRef(null);
    const PER_PAGE = 20;
    const ESTIMATED_PANEL_HEIGHT = 420;
    const VIEWPORT_MARGIN = 8;

    const normalizedSelected = useMemo(
        () => selectedSheets.map((id) => String(id)),
        [selectedSheets]
    );
    const isSheetSelected = (id) => normalizedSelected.includes(String(id));

    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
        const spaceAbove = rect.top - VIEWPORT_MARGIN;
        const openUp = spaceBelow < ESTIMATED_PANEL_HEIGHT && spaceAbove > spaceBelow;
        const maxHeight = Math.max(160, Math.min(360, (openUp ? spaceAbove : spaceBelow)));

        setCoords({
            top: openUp ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width,
            openUp,
            maxHeight,
        });
    };

    const loadSheets = async (search = '', page = 1) => {
        setLoading(true);
        try {
            const params = {
                limit: PER_PAGE,
                offset: (page - 1) * PER_PAGE,
            };
            if (search.trim()) {
                params.search = search.trim();
            }

            const result = await dispatch(getSheetsForSelectThunk(params)).unwrap();

            let items = [];
            let count = 0;

            if (result?.data && Array.isArray(result.data)) {
                items = result.data;
                if (result?.meta && typeof result.meta.count === 'number') {
                    count = result.meta.count;
                } else {
                    count = result.data.length;
                }
            } else if (Array.isArray(result)) {
                items = result;
                count = result.length;
            } else if (result?.results && Array.isArray(result.results)) {
                items = result.results;
                count = result.count || result.results.length;
            }

            setAllSheets(items);
            setTotalCount(count);

            setSheetsCache((prev) => {
                const next = { ...prev };
                items.forEach((s) => {
                    if (s?.id) next[s.id] = s;
                });
                return next;
            });
        } catch (error) {
            console.error('خطا در دریافت ورق‌ها:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSheets('', 1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            loadSheets(searchTerm, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

    const goToPage = (page) => {
        if (page < 1 || page > totalPages || loading) return;
        setCurrentPage(page);
        loadSheets(searchTerm, page);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedContainer = containerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedContainer && !clickedPanel) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handle = () => updateCoords();
        window.addEventListener('scroll', handle, true);
        window.addEventListener('resize', handle);
        return () => {
            window.removeEventListener('scroll', handle, true);
            window.removeEventListener('resize', handle);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setPanelVisible(true));
            return () => cancelAnimationFrame(raf);
        } else {
            setPanelVisible(false);
        }
    }, [isOpen]);

    const selectedSheetsDetails = useMemo(() => {
        return normalizedSelected
            .map((id) => sheetsCache[id])
            .filter(Boolean);
    }, [normalizedSelected, sheetsCache]);

    const handleToggleSheet = (sheetId) => {
        const idStr = String(sheetId);
        if (normalizedSelected.includes(idStr)) {
            onChange(selectedSheets.filter((id) => String(id) !== idStr));
        } else {
            onChange([...selectedSheets, idStr]);
        }
        setIsOpen(false);
    };

    const handleRemoveSheet = (e, sheetId) => {
        e.stopPropagation();
        const idStr = String(sheetId);
        onChange(selectedSheets.filter((id) => String(id) !== idStr));
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        onChange([]);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            updateCoords();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const renderSheetRow = (sheet, isSelected) => {
        const title = sheet.display_name || sheet.name || sheet.code || "بدون عنوان";
        const code = sheet.code || "";

        return (
            <button
                key={sheet.id}
                type="button"
                onClick={() => handleToggleSheet(sheet.id)}
                className={`w-full px-3 py-2 text-right text-xs flex items-center justify-between gap-2 mx-1 my-0.5 rounded-lg transition-all duration-150 ${
                    isSelected
                        ? "bg-Secondary/10 text-Secondary"
                        : "text-Primary hover:bg-Input_bg hover:translate-x-[-1px]"
                }`}
                style={{ width: 'calc(100% - 8px)' }}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] flex-shrink-0 transition-all duration-150 ${
                            isSelected
                                ? "bg-Secondary border-Secondary text-white scale-100"
                                : "border-Card_border scale-95"
                        }`}
                    >
                        <i
                            className={`fas fa-check transition-all duration-150 ${
                                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                            }`}
                        />
                    </span>
                    <span className="truncate">{title}</span>
                </div>
                {code && (
                    <span
                        dir="ltr"
                        className="text-Muted text-[10px] flex-shrink-0 bg-Input_bg/60 px-1.5 py-0.5 rounded-md"
                    >
                        {code}
                    </span>
                )}
            </button>
        );
    };

    const panel = isOpen && !disabled ? createPortal(
        <div
            ref={panelRef}
            dir="rtl"
            style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + 6,
                bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                zIndex: 9999,
                opacity: panelVisible ? 1 : 0,
                transform: panelVisible
                    ? 'translateY(0) scale(1)'
                    : `translateY(${coords.openUp ? 6 : -6}px) scale(0.98)`,
                transition: 'opacity 160ms ease, transform 160ms ease',
            }}
            className="rounded-2xl border border-Card_border bg-Background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 bg-gradient-to-l from-Secondary/15 via-Secondary/5 to-transparent border-b border-Card_border flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] font-medium text-Secondary flex items-center gap-1.5">
                    <i className="fas fa-layer-group text-[10px]" />
                    انتخاب ورق‌ها
                </span>
                {totalCount > 0 && (
                    <span className="text-[10px] text-Muted">
                        {totalCount.toLocaleString("fa-IR")} مورد
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-1">
                {selectedSheetsDetails.length > 0 && (
                    <div className="mb-1">
                        <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-Secondary flex items-center gap-1">
                                <i className="fas fa-check-double text-[9px]" />
                                انتخاب شده ({selectedSheetsDetails.length.toLocaleString("fa-IR")})
                            </span>
                        </div>
                        {selectedSheetsDetails.map((sheet) =>
                            renderSheetRow(sheet, true)
                        )}
                        <div className="border-t border-Card_border my-1 mx-2" />
                    </div>
                )}

                {loading && allSheets.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-Secondary" />
                        در حال بارگذاری...
                    </div>
                ) : allSheets.length === 0 && selectedSheetsDetails.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-inbox text-lg opacity-40" />
                        ورقی یافت نشد
                    </div>
                ) : (
                    allSheets.map((sheet) => {
                        if (isSheetSelected(sheet.id)) return null;
                        return renderSheetRow(sheet, false);
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-Card_border bg-Input_bg/40 flex-shrink-0">
                    <span className="text-[10px] text-Muted">
                        صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-right text-[10px]" />
                        </button>

                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => goToPage(page)}
                                disabled={loading}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-medium transition-all duration-150 ${
                                    currentPage === page
                                        ? "bg-gradient-to-br from-Secondary to-Secondary/80 text-white shadow-sm shadow-Secondary/40"
                                        : "text-Primary hover:bg-Background"
                                }`}
                            >
                                {page.toLocaleString("fa-IR")}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-xs text-Muted hover:bg-Background hover:text-Secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <i className="fas fa-chevron-left text-[10px]" />
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative" ref={containerRef}>
                <div
                    className={`bg-Input_bg border rounded-lg px-3 py-2 text-sm text-Primary cursor-text transition-all duration-150 ${
                        isOpen ? "border-Secondary ring-2 ring-Secondary/20" : "border-Card_border"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={toggleDropdown}
                >
                    <div className="flex items-center gap-2">
                        <i className="fas fa-magnifying-glass text-[11px] text-Muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="جستجوی ورق..."
                            value={isOpen ? searchTerm : ""}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => !disabled && setIsOpen(true)}
                            disabled={disabled}
                            className="flex-1 bg-transparent outline-none text-sm text-Primary placeholder:text-Muted/60 min-w-0 truncate"
                            dir="rtl"
                        />
                        {selectedSheets.length > 0 && !isOpen && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-white bg-gradient-to-br from-Secondary to-Secondary/80 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {selectedSheets.length.toLocaleString("fa-IR")}
                            </span>
                        )}
                        {selectedSheets.length > 0 && !isOpen && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={disabled}
                                className="flex-shrink-0 text-Muted hover:text-red-500 transition-colors"
                                title="پاک کردن همه"
                            >
                                <i className="fas fa-times text-xs" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={toggleDropdown}
                            disabled={disabled}
                            className="flex-shrink-0 text-Muted hover:text-Secondary transition-colors"
                        >
                            <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] transition-transform`} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedSheetsDetails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedSheetsDetails.map((sheet) => {
                        const title = sheet.display_name || sheet.name || sheet.code || "بدون عنوان";
                        return (
                            <span
                                key={sheet.id}
                                className="inline-flex items-center gap-1.5 max-w-full bg-Secondary/10 text-Secondary text-[11px] pl-1.5 pr-2.5 py-1 rounded-full"
                            >
                                <span className="truncate max-w-[160px]">{title}</span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemoveSheet(e, sheet.id)}
                                    disabled={disabled}
                                    className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-Secondary hover:text-white transition-colors disabled:pointer-events-none"
                                >
                                    <i className="fas fa-times text-[8px]" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {panel}
        </div>
    );
};

// ======== کامپوننت سلکت اولویت با استایل مشابه ========
const PrioritySelect = ({ value, onChange, disabled }) => {
    const dispatch = useDispatch();
    const { orderTypes, loading } = useSelector((state) => state.orderType || { orderTypes: [], loading: false });
    
    const [isOpen, setIsOpen] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false, maxHeight: 200 });
    const containerRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        dispatch(getOrderTypeThunk());
    }, [dispatch]);

    const options = orderTypes.map(item => ({
        value: item.value,
        label: item.label,
        color: item.value === 'high' ? 'text-red-500' 
            : item.value === 'normal' ? 'text-green-500' 
            : item.value === 'low' ? 'text-blue-500' 
            : 'text-gray-500'
    }));

    const selectedOption = options.find(opt => opt.value === value) || options[0] || { value: '', label: 'انتخاب اولویت', color: 'text-Muted' };

    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
        const maxHeight = Math.max(160, Math.min(200, (openUp ? spaceAbove : spaceBelow)));

        setCoords({
            top: openUp ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width,
            openUp,
            maxHeight,
        });
    };

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            updateCoords();
            setTimeout(() => setPanelVisible(true), 50);
        } else {
            setPanelVisible(false);
        }
    };

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setPanelVisible(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedContainer = containerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedContainer && !clickedPanel) {
                setIsOpen(false);
                setPanelVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const panel = isOpen && !disabled ? createPortal(
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + 6,
                bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
                zIndex: 9999,
                opacity: panelVisible ? 1 : 0,
                transform: panelVisible
                    ? 'translateY(0) scale(1)'
                    : `translateY(${coords.openUp ? 6 : -6}px) scale(0.98)`,
                transition: 'opacity 160ms ease, transform 160ms ease',
            }}
            className="rounded-2xl border border-Card_border bg-Background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden ring-1 ring-black/5"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 bg-gradient-to-l from-Secondary/15 via-Secondary/5 to-transparent border-b border-Card_border flex-shrink-0">
                <span className="text-[11px] font-medium text-Secondary flex items-center gap-1.5">
                    <i className="fas fa-flag text-[10px]" />
                    انتخاب اولویت
                </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto py-1">
                {loading ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-Secondary" />
                        در حال بارگذاری...
                    </div>
                ) : options.length === 0 ? (
                    <div className="px-3 py-6 text-xs text-Muted text-center flex flex-col items-center gap-2">
                        <i className="fas fa-inbox text-lg opacity-40" />
                        اولویتی یافت نشد
                    </div>
                ) : (
                    options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={`w-full px-3 py-2 text-right text-xs flex items-center gap-2 mx-1 my-0.5 rounded-lg transition-all duration-150 ${
                                value === option.value
                                    ? "bg-Secondary/10 text-Secondary"
                                    : "text-Primary hover:bg-Input_bg hover:translate-x-[-1px]"
                            }`}
                            style={{ width: 'calc(100% - 8px)' }}
                        >
                            <span
                                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] flex-shrink-0 transition-all duration-150 ${
                                    value === option.value
                                        ? "bg-Secondary border-Secondary text-white scale-100"
                                        : "border-Card_border scale-95"
                                }`}
                            >
                                <i
                                    className={`fas fa-check transition-all duration-150 ${
                                        value === option.value ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                    }`}
                                />
                            </span>
                            <span className={option.color}>{option.label}</span>
                        </button>
                    ))
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div ref={containerRef}>
            <div
                className={`bg-Input_bg border rounded-lg px-3 py-2 text-sm text-Primary cursor-pointer transition-all duration-150 ${
                    isOpen ? "border-Secondary ring-2 ring-Secondary/20" : "border-Card_border"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={toggleDropdown}
            >
                <div className="flex items-center justify-between">
                    <span className={selectedOption.color}>{selectedOption.label}</span>
                    <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] text-Muted transition-transform`} />
                </div>
            </div>
            {panel}
        </div>
    );
};

// ======== مودال اصلی ========
const CreateProductionOrderModal = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const contentRef = useRef(null);
    const { loading: createLoading, error: createError, success } = useSelector((state) => state.createOrder || { loading: false, error: null, success: false });

    const [formData, setFormData] = useState({
        product_id: '',
        color_id: '',
        sheet_id: '',
        order_qty: '',
        order_type: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            dispatch(clearCreateOrderState());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (success) {
            setSubmitting(false);
            onSuccess?.();
            onClose();
        }
    }, [success, onSuccess, onClose]);

    useEffect(() => {
        if (createError) {
            setError(createError?.message?.fa || createError?.detail || 'خطا در ایجاد سفارش');
            setSubmitting(false);
        }
    }, [createError]);

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        setError(null);
    };

    const handleGoodsChange = (selectedIds) => {
        setFormData((prev) => ({ ...prev, product_id: selectedIds[0] || '' }));
        setError(null);
    };

    const handleColorChange = (selectedIds) => {
        setFormData((prev) => ({ ...prev, color_id: selectedIds[0] || '' }));
        setError(null);
    };

    const handleSheetChange = (selectedIds) => {
        setFormData((prev) => ({ ...prev, sheet_id: selectedIds[0] || '' }));
        setError(null);
    };

    const handlePriorityChange = (value) => {
        setFormData((prev) => ({ ...prev, order_type: value }));
        setError(null);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contentRef.current && contentRef.current.contains(e.target)) {
                return;
            }
            onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.product_id) {
            setError('لطفاً کالا را انتخاب کنید');
            return;
        }

        if (!formData.color_id) {
            setError('لطفاً رنگ را انتخاب کنید');
            return;
        }

        if (!formData.sheet_id) {
            setError('لطفاً ورق را انتخاب کنید');
            return;
        }

        if (!formData.order_qty || Number(formData.order_qty) < 1) {
            setError('لطفاً تعداد معتبر وارد کنید');
            return;
        }

        if (!formData.order_type) {
            setError('لطفاً اولویت را انتخاب کنید');
            return;
        }

        setSubmitting(true);
        setError(null);

        const payload = {
            orders: [{
                product_id: formData.product_id,
                color_id: formData.color_id,
                sheet_id: formData.sheet_id,
                order_qty: Number(formData.order_qty),
                order_type: formData.order_type,
                description: formData.description || '',
            }]
        };

        try {
            await dispatch(createOrderThunk(payload)).unwrap();
        } catch (err) {
            setError(err?.message?.fa || err?.detail || 'خطا در ایجاد سفارش');
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div
                ref={contentRef}
                className="w-full max-w-lg rounded-xl border border-Card_border bg-Background shadow-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 border-b border-Card_border pb-3">
                    <h3 className="text-sm font-medium text-Primary">ایجاد دستور تولید جدید</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-Muted hover:text-Primary transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">کالا *</label>
                        <GoodsSearchableSelect
                            selectedGoods={formData.product_id ? [formData.product_id] : []}
                            onChange={handleGoodsChange}
                            disabled={submitting || createLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">رنگ *</label>
                        <PaintSearchableSelect
                            selectedPaints={formData.color_id ? [formData.color_id] : []}
                            onChange={handleColorChange}
                            disabled={submitting || createLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">ورق *</label>
                        <SheetSearchableSelect
                            selectedSheets={formData.sheet_id ? [formData.sheet_id] : []}
                            onChange={handleSheetChange}
                            disabled={submitting || createLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">تعداد *</label>
                        <input
                            type="number"
                            value={formData.order_qty}
                            onChange={handleChange('order_qty')}
                            placeholder="مثلاً ۱۰۰"
                            min="1"
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                            disabled={submitting || createLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">اولویت *</label>
                        <PrioritySelect
                            value={formData.order_type}
                            onChange={handlePriorityChange}
                            disabled={submitting || createLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-Muted">توضیحات</label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={handleChange('description')}
                            placeholder="توضیحات اضافی..."
                            className="w-full text-sm rounded-md border border-Card_border bg-Input_bg/40 px-3 py-2 text-Primary outline-none focus:border-Primary/50"
                            disabled={submitting || createLoading}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-red-200 bg-red-50 text-red-700">
                            <i className="fa-solid fa-triangle-exclamation text-xs" />
                            <span className="text-xs">{error}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-Card_border">
                        <button
                            type="submit"
                            disabled={submitting || createLoading}
                            className="flex-1 h-10 rounded-lg bg-Secondary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {submitting || createLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin ml-1" />
                                    در حال ایجاد...
                                </>
                            ) : (
                                'ایجاد دستور تولید'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting || createLoading}
                            className="flex-1 h-10 rounded-lg border border-Card_border text-Primary text-sm font-medium hover:bg-Input_bg transition-colors"
                        >
                            انصراف
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductionOrderModal;