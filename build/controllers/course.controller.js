"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourse = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
//upload course
exports.uploadCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        console.log(data);
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        //   createCourse(data, res, next);
        const course = await course_model_1.default.create(data);
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        await redis_1.redis.set("allCourses", JSON.stringify(courses));
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.editCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        console.log(data);
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = (await course_model_1.default.findById(courseId));
        if (thumbnail && typeof thumbnail === "string") {
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (typeof thumbnail === "object") {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, { new: true });
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        await redis_1.redis.set("allCourses", JSON.stringify(courses));
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getSingleCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({ success: true, course });
        }
        else {
            const course = await course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); //7 day expire
            res.status(200).json({ success: true, course });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getAllCourses = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const isCacheExist = await redis_1.redis.get("allCourses");
        if (isCacheExist) {
            const courses = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set("allCourses", JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get course content for only valid user
exports.getCourseByUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.find((course) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { question, contentId, courseId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const couseContent = course?.courseData.find((item) => item._id.equals(contentId));
        if (!couseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        // create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add this question to our course content
        couseContent.questions.push(newQuestion);
        await notification_model_1.default.create({
            userId: req.user?._id,
            title: "New Question",
            message: `You have a new question in ${couseContent.title}`,
        });
        await course?.save();
        res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { answer, contentId, courseId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const couseContent = course?.courseData.find((item) => item._id.equals(contentId));
        if (!couseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const question = couseContent.questions.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        // create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date(Date.now()).toISOString(),
            updatedAt: new Date(Date.now()).toISOString(),
        };
        question.questionReplies?.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user?._id) {
            await notification_model_1.default.create({
                userId: req.user?._id,
                title: "New Question",
                message: `You have a new question in ${couseContent?.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: couseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    data,
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
        }
        res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        // check if courseId already exist in userCourseList
        const courseExist = userCourseList?.some((course) => course._id.toString() === courseId);
        if (!courseExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course)
            course.ratings = avg / course.reviews.length; // on exemple we have 2 review 5 and 4 = 9/2  = 4.5 ratings
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        const notification = {
            title: "New Review Received",
            message: `${req.user?.name} has given a review in ${course?.name}`,
        };
        // create notification
        await notification_model_1.default.create({
            userId: req.user?._id,
            ...notification,
        });
        res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const replyData = {
            user: req.user,
            comment,
            createdAt: new Date(Date.now()).toISOString(),
            updatedAt: new Date(Date.now()).toISOString(),
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(replyData);
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// only for admin
exports.getAllCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().sort({ createdAt: -1 });
        console.log(courses);
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.deleteCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await course_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("Course not found", 401));
        }
        await user.deleteOne({ id });
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        await redis_1.redis.set("allCourses", JSON.stringify(courses));
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// GENERATE VIDEO URL
exports.generateVideoUrl = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error?.message, 400));
    }
});
