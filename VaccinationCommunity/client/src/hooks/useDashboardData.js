import { useCallback, useEffect, useState } from "react";

export default function useDashboardData(resources) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState([]);
    const reload = useCallback(async () => {
        setLoading(true);
        const entries = Object.entries(resources);
        const results = await Promise.allSettled(entries.map(([, load]) => load()));
        const next = {};
        const errors = [];
        results.forEach((result, index) => {
            const key = entries[index][0];
            if (result.status === "fulfilled") next[key] = result.value?.data;
            else errors.push(key);
        });
        setData(next); setFailed(errors); setLoading(false);
    }, [resources]);
    useEffect(() => {
        let active = true;
        queueMicrotask(() => { if (active) reload(); });
        return () => { active = false; };
    }, [reload]);
    return { data, loading, failed, reload };
}
