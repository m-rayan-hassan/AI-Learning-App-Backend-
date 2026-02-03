import multer from "multer";

export const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Max size is 50MB",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field",
      });
    }

    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.message === "Invalid file type") {
    return res.status(400).json({
      message: err.message,
    });
  }

  next(err);
};
