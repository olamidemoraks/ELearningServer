"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// create layout
exports.createLayout = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeExist = await layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} already exist`, 500));
        }
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                image: { public_id: myCloud.public_id, url: myCloud.secure_url },
                title,
                subTitle,
            };
            await layout_model_1.default.create({ type: "Banner", banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.create({
                type: "Categories",
                categories: categoryItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout created successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//Edit layout
exports.editLayout = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            image.startsWith("https")
                ? bannerData
                : await cloudinary_1.default.v2.uploader.destroy(bannerData?.image.public_id);
            const data = image.startsWith("https")
                ? bannerData
                : await cloudinary_1.default.v2.uploader.upload(image, { folder: "layout" });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? bannerData?.banner?.image.public_id
                        : data?.public_id,
                    url: image.startsWith("https")
                        ? bannerData?.banner?.image.url
                        : data?.secure_url,
                },
                title,
                subTitle,
            };
            await layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        if (type === "FAQ") {
            const faqData = await layout_model_1.default.findOne({ type: "FAQ" });
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(faqData._id, { faq: faqItems });
        }
        if (type === "Categories") {
            const category = await layout_model_1.default.findOne({ type: "Categories" });
            const { categories } = req.body;
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(category._id, {
                type: "Categories",
                categories: categoryItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout updated successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get layout by type
exports.getLayoutByType = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const type = req.params.type;
        const layout = await layout_model_1.default.findOne({ type });
        res.status(200).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
