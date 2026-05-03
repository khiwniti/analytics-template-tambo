import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import portfolioRouter from "./portfolio";
import githubActivityRouter from "./github-activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(portfolioRouter);
router.use(githubActivityRouter);

export default router;
