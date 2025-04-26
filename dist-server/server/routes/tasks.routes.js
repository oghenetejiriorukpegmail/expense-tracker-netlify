import express from "express";
export function createBackgroundTaskRouter(storage) {
    const router = express.Router();
    // GET /api/background-tasks
    router.get("/", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const tasks = await storage.getBackgroundTasksByUserId(internalUserId);
            res.json(tasks);
        }
        catch (error) {
            next(error);
        }
    });
    // GET /api/background-tasks/:id
    router.get("/:id", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId))
                return res.status(400).send("Invalid task ID");
            const task = await storage.getBackgroundTaskById(taskId);
            if (!task)
                return res.status(404).send("Background task not found");
            if (task.userId !== internalUserId)
                return res.status(403).send("Forbidden");
            res.json(task);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
