const Contract = require("../models/Contract");
const Analysis = require("../models/Analysis");

exports.getStats = async (req, res) => {
  const [totalContracts, totalAnalyses, allAnalyses, recentAnalyses] = await Promise.all([
    Contract.countDocuments(),
    Analysis.countDocuments(),
    Analysis.find({}, "healthScore"),
    Analysis.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("contractId", "filename"),
  ]);

  const avgScore =
    allAnalyses.length > 0
      ? Math.round(allAnalyses.reduce((sum, a) => sum + a.healthScore, 0) / allAnalyses.length)
      : 0;

  const scoreDistribution = { safe: 0, moderate: 0, highRisk: 0, dangerous: 0 };
  for (const a of allAnalyses) {
    if (a.healthScore >= 75)      scoreDistribution.safe++;
    else if (a.healthScore >= 50) scoreDistribution.moderate++;
    else if (a.healthScore >= 25) scoreDistribution.highRisk++;
    else                          scoreDistribution.dangerous++;
  }

  res.json({
    totalContracts,
    totalAnalyses,
    averageHealthScore: avgScore,
    scoreDistribution,
    recentAnalyses: recentAnalyses.map((a) => ({
      id:          a._id,
      contractId:  a.contractId?._id,
      filename:    a.contractId?.filename,
      healthScore: a.healthScore,
      language:    a.language,
      stats:       a.stats,
      createdAt:   a.createdAt,
    })),
  });
};
