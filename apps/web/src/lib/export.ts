type ExportDraft = {
  platform: string;
  caption: string;
  mediaType: string;
  hashtags: string;
  riskLevel: string;
  approvalStatus: string;
  scheduledAt: Date | null;
};

export function buildManualExport(input: { brandName: string; drafts: ExportDraft[] }) {
  return {
    exportedAt: new Date().toISOString(),
    brandName: input.brandName,
    posts: input.drafts.map((draft) => ({
      platform: draft.platform,
      caption: draft.caption,
      mediaType: draft.mediaType,
      hashtags: JSON.parse(draft.hashtags) as string[],
      riskLevel: draft.riskLevel,
      approvalStatus: draft.approvalStatus,
      scheduledAt: draft.scheduledAt?.toISOString() ?? null
    }))
  };
}
