const express = require("express");
const {
  getHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
} = require("../controllers/holdings.controller");

const router = express.Router();

router.get("/", getHoldings);
router.post("/", createHolding);
router.put("/:id", updateHolding);
router.delete("/:id", deleteHolding);

module.exports = router;
