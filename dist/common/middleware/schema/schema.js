import * as z from "zod";
import { AppError } from "../../utils/global/response.error.js";
export const schema = (schema) => {
    return async (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const formattedErrors = result.error.issues.map(err => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError({ message: "Validation Error", errors: formattedErrors }, 400);
        }
        req.body = result.data;
        next();
    };
};
