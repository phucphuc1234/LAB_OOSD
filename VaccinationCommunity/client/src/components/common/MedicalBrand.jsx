import { ShieldPlus } from "lucide-react";

export default function MedicalBrand({ compact = false }) {
    return <span className={`medical-brand${compact ? " medical-brand-compact" : ""}`}>
        <span className="medical-brand-mark"><ShieldPlus size={25} strokeWidth={1.8} /></span>
        <span><span className="medical-brand-name">Cổng theo dõi tiêm chủng cộng đồng</span><small className="medical-brand-region">TP. Hồ Chí Minh</small></span>
    </span>;
}
