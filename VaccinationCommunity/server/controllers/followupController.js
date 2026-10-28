const service = require("../services/followupService");

function publicError(error) {
    const number = error.number || error.originalError?.info?.number;
    const status = error.statusCode || ({ 51000: 400, 51001: 404, 51002: 403, 51003: 409, 51004: 409 }[number]) || 500;
    return { status, message: status >= 500
        ? "Không thể xử lý theo dõi sau tiêm lúc này. Vui lòng thử lại."
        : error.message };
}

function createFollowupController(api = service) {
    const handle = (operation, { status = 200, message } = {}) => async (req, res) => {
        try {
            const data = await operation(req);
            res.status(status).json({ success: true, ...(message ? { message } : {}), data });
        } catch (error) {
            const result = publicError(error);
            res.status(result.status).json({ success: false, message: result.message });
        }
    };
    return {
        symptoms: handle((req) => api.symptoms(req.user)),
        vaccinations: handle((req) => api.vaccinations(req.user)),
        mine: handle((req) => api.listMine(req.user, req.query)),
        list: handle((req) => api.listAll(req.user, req.query)),
        detail: handle((req) => api.detail(req.user, req.params.id)),
        submit: handle((req) => api.submit(req.user, req.body), {
            status: 201, message: "Đã ghi nhận phiếu theo dõi. Hãy đọc hướng dẫn ưu tiên ngay trên phiếu.",
        }),
        review: handle((req) => api.review(req.user, req.params.id, req.body), {
            message: "Đã lưu xử lý và lịch sử theo dõi.",
        }),
    };
}
module.exports = { ...createFollowupController(), createFollowupController, publicError };
