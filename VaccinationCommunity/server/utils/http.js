const errorResponse = (res, error) => {
    const number = error.number ?? error.originalError?.info?.number;
    const databaseStatus = { 51000: 400, 51001: 404, 51002: 403, 51003: 409, 51004: 409 }[number];
    let status = error.statusCode || databaseStatus || 500;
    let message = error.message;
    if ([2601, 2627].includes(number)) {
        status = 409;
        message = "Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.";
    } else if (number === 547) {
        status = 409;
        message = "Dữ liệu có liên quan đến hồ sơ khác; không thể thực hiện thay đổi này.";
    } else if (number === 1205) {
        status = 409;
        message = "Dữ liệu đang được cập nhật. Vui lòng thử lại.";
    } else if ([245, 2628, 8152].includes(number)) {
        status = 400;
        message = "Dữ liệu không đúng định dạng hoặc vượt quá độ dài cho phép.";
    } else if (status >= 500) {
        message = "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.";
    }
    return res.status(status).json({ success: false, message });
};

const action = (operation, message, status = 200) => async (req, res) => {
    try {
        if (req.body === undefined) req.body = {};
        const data = await operation(req);
        return res.status(status).json({ success: true, ...(message ? { message } : {}), data });
    } catch (error) {
        return errorResponse(res, error);
    }
};

module.exports = { action, errorResponse };
