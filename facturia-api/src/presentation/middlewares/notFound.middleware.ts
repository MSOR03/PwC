import type { RequestHandler } from "express";
import { NotFoundError } from "../../business/domain/errors";

export const notFound : RequestHandler = (req, _res, next) => {
    next(new NotFoundError(`The path ${req.method} ${req.originalUrl} does not exist`));
}