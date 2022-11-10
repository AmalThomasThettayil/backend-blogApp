const express = require("express");
const {
    createCategoryCtrl,
    fetchAllCategory,
    fetchCategoryCtrl,
    updateCategoryCtrl,
    deleteCategoryCtrl,
} = require("../../controllers/category/categoryCtrl");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const categoryRoute = express.Router();

categoryRoute.post("/",
    authMiddleware,
    createCategoryCtrl,
);
categoryRoute.get("/",
    fetchAllCategory
);
categoryRoute.get("/:id",
    authMiddleware,
    fetchCategoryCtrl
);
categoryRoute.put("/:id",
    authMiddleware,
    updateCategoryCtrl
);
categoryRoute.delete("/:id",
    authMiddleware,
    deleteCategoryCtrl,
);

module.exports = categoryRoute;