import SwiftUI

struct ReviewCompletionSummary {
    let completedCount: Int
    let totalCount: Int
    let continuedCount: Int
    let masteredCount: Int
    let breakdowns: [ReviewCategoryBreakdown]
    let recommended: Category?

    var masteryRate: Double {
        guard completedCount > 0 else { return 0 }
        return Double(masteredCount) / Double(completedCount)
    }

    var coverageRate: Double {
        guard totalCount > 0 else { return 0 }
        return Double(completedCount) / Double(totalCount)
    }

    var isFullyMastered: Bool {
        completedCount > 0 && masteredCount == completedCount
    }

    var headline: String {
        guard completedCount > 0 else { return "本轮没有作答记录" }
        switch masteryRate {
        case 1.0:
            return "全部掌握，保持手感"
        case 0.7..<1.0:
            return "状态不错，继续巩固"
        case 0.4..<0.7:
            return "稳步推进，薄弱项要盯紧"
        default:
            return "难点较多，建议继续攻克"
        }
    }

    var suggestion: String {
        if completedCount == 0 {
            return "先做几题再回来看看本轮表现。"
        }
        if let recommended {
            return "下一步可以继续攻克「\(recommended.cat)」，这轮在这里被标记“继续学习”最多。"
        }
        if isFullyMastered {
            return "这一轮全部标记为掌握，可以换个专题再来一轮。"
        }
        return "结果已记录，稍后回来再过一遍，会更稳。"
    }
}

struct ReviewCategoryBreakdown: Identifiable {
    let category: Category
    let total: Int
    let mastered: Int
    let continued: Int

    var id: String { category.id }

    var rate: Double {
        guard total > 0 else { return 0 }
        return Double(mastered) / Double(total)
    }
}

struct ReviewCompletionView: View {
    let summary: ReviewCompletionSummary
    let onRestart: () -> Void
    let onContinueCategory: (Category) -> Void
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header
            masteryCard
            statPills
            if !summary.breakdowns.isEmpty {
                breakdownCard
            }
            actionRow
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            KickerText(text: "Session Complete")
            Text("本轮复习完成")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Theme.fg)
            Text(summary.headline)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var masteryCard: some View {
        HStack(spacing: 16) {
            MasteryRing(progress: summary.masteryRate, tint: ringTint)
                .frame(width: 92, height: 92)

            VStack(alignment: .leading, spacing: 6) {
                KickerText(text: "Mastery Rate")
                Text("\(Int(round(summary.masteryRate * 100)))%")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.fg)
                    .monospacedDigit()
                Text(summary.suggestion)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.fgMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(18)
        .elevatedCard(bg: Theme.surface)
    }

    private var statPills: some View {
        HStack(spacing: 10) {
            summaryPill(title: "完成", value: "\(summary.completedCount)", tint: Theme.accent)
            summaryPill(title: "继续学", value: "\(summary.continuedCount)", tint: Theme.warningSolid)
            summaryPill(title: "已掌握", value: "\(summary.masteredCount)", tint: Theme.successSolid)
        }
    }

    private var breakdownCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    KickerText(text: "By Topic")
                    Text("本轮专题分布")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Theme.fg)
                }
                Spacer()
                Text("\(summary.breakdowns.count) 个专题")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.fgMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .brutalOutlined(bg: Theme.base2, radius: 999)
            }

            VStack(spacing: 10) {
                ForEach(summary.breakdowns) { row in
                    breakdownRow(row)
                }
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.base2)
    }

    private func breakdownRow(_ row: ReviewCategoryBreakdown) -> some View {
        let isRecommended = row.category.id == summary.recommended?.id
        let tint = Theme.categoryTint(row.category.color)

        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                        .fill(tint.opacity(0.18))
                    Text(row.category.icon)
                        .font(.system(size: 16))
                }
                .frame(width: 34, height: 34)

                VStack(alignment: .leading, spacing: 3) {
                    Text(row.category.cat)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.fg)
                        .lineLimit(1)
                    Text("\(row.mastered)/\(row.total) 掌握 · \(row.continued) 继续")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.fgMuted)
                }
                Spacer()
                if isRecommended {
                    Text("重点")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            Capsule().fill(Theme.dangerSolid)
                        )
                }
            }
            ThinProgressBar(progress: row.rate, height: 6)
        }
        .padding(12)
        .elevatedCard(bg: Theme.surface, radius: Theme.rSm)
    }

    private var actionRow: some View {
        VStack(spacing: 10) {
            if let recommended = summary.recommended {
                Button {
                    onContinueCategory(recommended)
                } label: {
                    BrutalButtonLabel(
                        title: "继续攻克「\(recommended.cat)」",
                        icon: "flame",
                        bg: Theme.dangerSolid,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }

            HStack(spacing: 10) {
                Button {
                    onRestart()
                } label: {
                    BrutalButtonLabel(
                        title: "再来一轮",
                        icon: "arrow.counterclockwise",
                        bg: Theme.base2,
                        fg: Theme.fg,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)

                Button {
                    onDismiss()
                } label: {
                    BrutalButtonLabel(
                        title: "返回学习",
                        icon: "house",
                        bg: Theme.accent,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func summaryPill(title: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .monospaced))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .elevatedCard(bg: Theme.surface)
    }

    private var ringTint: Color {
        switch summary.masteryRate {
        case 0.7...:
            return Theme.successSolid
        case 0.4..<0.7:
            return Theme.warningSolid
        default:
            return Theme.dangerSolid
        }
    }
}

private struct MasteryRing: View {
    let progress: Double
    let tint: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(Theme.base2, lineWidth: 10)
            Circle()
                .trim(from: 0, to: max(0.001, min(1, progress)))
                .stroke(
                    LinearGradient(colors: [tint, tint.opacity(0.75)], startPoint: .top, endPoint: .bottom),
                    style: StrokeStyle(lineWidth: 10, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(Theme.ease, value: progress)

            Text("\(Int(round(progress * 100)))%")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.fg)
                .monospacedDigit()
        }
    }
}
