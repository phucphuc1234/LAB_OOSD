const fail = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const object = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        fail("Dữ liệu gửi lên phải là một đối tượng.");
    }
    return value;
};

const integer = (value, label = "Mã", min = 1, max = 2147483647) => {
    if (typeof value !== "number" && !(typeof value === "string" && /^\d+$/.test(value))) {
        fail(`${label} phải là số nguyên hợp lệ.`);
    }
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < min || number > max) {
        fail(`${label} phải từ ${min} đến ${max}.`);
    }
    return number;
};

const text = (value, label, max, required = false) => {
    if (value === undefined || value === null) {
        if (required) fail(`${label} không được để trống.`);
        return null;
    }
    if (typeof value !== "string" || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) fail(`${label} phải là chuỗi ký tự hợp lệ.`);
    const result = value.trim();
    if ((required && !result) || result.length > max) {
        fail(`${label} ${required && !result ? "không được để trống" : `không được quá ${max} ký tự`}.`);
    }
    return result || null;
};

const date = (value, label = "Ngày") => {
    if (!(typeof value === "string" || value instanceof Date) || !value) fail(`${label} không hợp lệ.`);
    if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
        fail(`${label} phải theo định dạng ISO (YYYY-MM-DD).`);
    }
    const result = new Date(value);
    if (!Number.isFinite(result.getTime())) fail(`${label} không hợp lệ.`);
    // Date.parse otherwise silently normalizes e.g. 2027-02-30 into March.
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const [year, month, day] = value.slice(0, 10).split("-").map(Number);
        const calendar = new Date(Date.UTC(year, month - 1, day));
        if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
            fail(`${label} không hợp lệ.`);
        }
    }
    if (result.getUTCFullYear() < 1900 || result.getUTCFullYear() > 9999) fail(`${label} không hợp lệ.`);
    return result;
};

const choice = (value, allowed, label = "Trạng thái") => {
    if (!allowed.includes(value)) fail(`${label} không hợp lệ.`);
    return value;
};

module.exports = { fail, object, integer, text, date, choice };
