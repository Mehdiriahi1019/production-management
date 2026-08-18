// pages/GoodsDitail.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { getGoodsDitailThunk } from '../../../features/production/goods/goodsditail/goodsditailthunk';
import { clearGoodsDitail } from '../../../features/production/goods/goodsditail/goodsditailslice';
import MainInfo from '../goodsditail/components/MainInfo';
import GoodsRoute from '../goodsditail/components/GoodsRoute';
import Files from '../goodsditail/components/Files';

const GoodsDitail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { data: item, loading, error } = useSelector((state) => state.goodsDitail);

    const fetchGoodsDetail = () => {
        if (id) {
            dispatch(getGoodsDitailThunk(id));
        }
    };

    useEffect(() => {
        fetchGoodsDetail();
        return () => {
            dispatch(clearGoodsDitail());
        };
    }, [id, dispatch]);

    const getErrorMessage = (err) => {
        if (typeof err === 'string') return err;
        if (err?.message?.fa) return err.message.fa;
        if (err?.fa) return err.fa;
        if (err?.detail) return err.detail;
        return 'خطا در دریافت اطلاعات';
    };

    if (loading && !item) {
        return (
            <div className="w-full px-2 sm:px-4">
                <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-center h-[400px]">
                        <span className="text-sm text-Muted">
                            <i className="fa-solid fa-spinner fa-spin ml-1" />
                            در حال بارگذاری...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full px-2 sm:px-4">
                <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-center h-[400px]">
                        <span className="text-sm text-red-500">
                            <i className="fa-solid fa-triangle-exclamation ml-1" />
                            {getErrorMessage(error)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="w-full px-2 sm:px-4">
                <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-center h-[400px]">
                        <span className="text-sm text-Muted">کالایی یافت نشد</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-2 sm:px-4">
            <div className="bg-Background border border-Card_border rounded-xl overflow-hidden">
                {/* هدر */}
                <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3 border-b border-Card_border">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/productionpage/goods"
                            className="flex items-center justify-center w-7 h-7 rounded-md text-Muted hover:text-Primary hover:bg-Input_bg transition-colors"
                        >
                            <i className="fa-solid fa-arrow-right text-sm" />
                        </Link>
                        <h3 className="text-sm font-medium text-Primary">
                            جزئیات کالا
                        </h3>
                    </div>
                    <span className="text-xs text-Muted bg-Input_bg px-2 py-0.5 rounded-full font-mono">
                        {item.sn_code || "—"}
                    </span>
                </div>

                {/* محتوای اصلی - دو ستونه */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                    {/* ستون راست - اطلاعات اصلی (2/3) */}
                    <div className="lg:col-span-2 space-y-4">
                        <MainInfo item={item} />
                        <GoodsRoute 
                            goodsId={item.id} 
                            routes={item.routes} 
                            onRouteChange={fetchGoodsDetail}
                        />
                    </div>

                    {/* ستون چپ - فایل‌ها (1/3) */}
                    <div className="lg:col-span-1 lg:self-start">
                        <Files id={id} files={item.files} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoodsDitail;