const Diff = require("diff");

/**
 * Compute a structured diff between two contract texts.
 */
function computeDiff(textA, textB) {
  const changes = Diff.diffLines(textA, textB);

  const structured = changes.map((part) => ({
    type:  part.added ? "add" : part.removed ? "remove" : "context",
    lines: part.value.split("\n").filter(Boolean),
    count: part.count || 0,
  }));

  const added   = changes.filter((p) => p.added).reduce((n, p) => n + (p.count || 0), 0);
  const removed = changes.filter((p) => p.removed).reduce((n, p) => n + (p.count || 0), 0);
  const similarity = Diff.diffChars(textA, textB)
    .filter((p) => !p.added && !p.removed)
    .reduce((n, p) => n + p.value.length, 0);
  const similarityPct = Math.round((similarity / Math.max(textA.length, textB.length)) * 100);

  return {
    changes: structured,
    stats: { additions: added, removals: removed, totalChanges: added + removed, similarityPct },
  };
}

module.exports = { computeDiff };
