import type { RequestHandler } from "express";
import type {z} from "zod";

//Defines the structure of request schemas for validation
interface RequestSchemas{
    body?: z.ZodType;
    params?: z.ZodType;
    query?: z.ZodType;   
}

export const validate = (schemas: RequestSchemas): RequestHandler => (req,res,next) => {
    try {
        if (schemas.body) {
            req.body = schemas.body.parse(req.body);
        }
        if (schemas.params) {
            req.params = schemas.params.parse(req.params) as typeof req.params;
        }
        if (schemas.query) {
            res.locals.query = schemas.query.parse(req.query);
        }
        next();
    } catch (err) {
        next(err);
    }
}