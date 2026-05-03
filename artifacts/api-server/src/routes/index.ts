import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import portfolioRouter from "./portfolio";
import githubActivityRouter from "./github-activity";
import threadTitleRouter from "./thread-title";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(portfolioRouter);
router.use(githubActivityRouter);
router.use(threadTitleRouter);

export default router;
