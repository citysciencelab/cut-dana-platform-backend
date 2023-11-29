import { Router } from "express";
import mongoSanitize from "express-mongo-sanitize";
import * as datasources_controller from "../controllers/datasources_controller.js";
import * as files_controller from "../controllers/files_controller.js";
import * as images_controller from "../controllers/images_controller.js";
import * as stories_controller from "../controllers/stories_controller.js";

const router = new Router();


// GET
router.get("/s/:story_id/:step_index", stories_controller.redirectToStep);
router.get("/stories", stories_controller.index);
router.get("/stories/:story_id", stories_controller.show);
router.get("/images/suggest", images_controller.suggest);
router.get("/datasources/:story_id/:datasource_hash", datasources_controller.getDatasource);

router.get("/dipastoryselector", stories_controller.getStoriesForDipas);
router.get("/files/:path(*)?", files_controller.getDatasource);


// POST
router.post("/stories",
    mongoSanitize(),
    stories_controller.create
);
router.post("/images/:story_id/:step_major/:step_minor/:image_hash",
    images_controller.imageUpload.single("image"),
    images_controller.addImagePath
);
router.post("/datasources/:story_id/:datasource_hash",
    datasources_controller.datasourceUpload.single("datasource"),
    (req, res) => {
        res.status(200);
        return res.send();
    }
);

router.post("/files/:path(*)?", files_controller.datasourceUpload.any(), files_controller.addFilePath);

// PATCH
router.patch("/stories/:story_id/featured", stories_controller.featured);
router.patch("/stories/:story_id/privacy", stories_controller.privacy);
router.patch("/stories/:story_id/:step_major/:step_minor/html",
    mongoSanitize(),
    stories_controller.updateHtml
);
router.patch("/stories/:story_id",
    mongoSanitize(),
    stories_controller.update
);

// DELETE
router.delete("/stories/:story_id", stories_controller.remove);

export default router;
