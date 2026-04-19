import SwiftUI
import SwiftData

struct SettingsView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var cloud: CloudSyncService
    @Environment(\.modelContext) private var ctx
    @AppStorage("appThemePreference") private var appThemePreferenceRaw = AppThemePreference.system.rawValue
    @AppStorage("appAccentPalette") private var appAccentPaletteRaw = AppAccentPalette.indigo.rawValue
    @Query private var progresses: [UserProgress]

    private var mastered: Int { progresses.filter { $0.status == 2 }.count }
    private var learning: Int { progresses.filter { $0.status == 1 }.count }
    private var favorited: Int { progresses.filter { $0.favorited }.count }
    private var pct: Double { store.totalCount > 0 ? Double(mastered)/Double(store.totalCount) : 0 }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    hero
                    progressCard
                    section(title: "外观") { appearanceCard }
                    section(title: "iCloud 同步") { cloudCard }
                    section(title: "题库信息") { libraryCard }
                    section(title: "开源协作") { openSourceCard }
                    section(title: "关于") { aboutCard }
                }
                .padding(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 8) {
            KickerText(text: "Settings")
            Text("偏好与同步").font(.system(size: 24, weight: .bold)).foregroundStyle(Theme.fg)
            Text("管理外观、同步和题库基础信息。")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4)
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Text("总体进度").font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.fg)
                Spacer()
                Text("\(Int(pct * 100))%").font(.system(size: 13, weight: .semibold, design: .monospaced)).foregroundStyle(Theme.accentHi)
            }
            ThinProgressBar(progress: pct)
            HStack(spacing: 18) {
                stat("已掌握", mastered, Theme.success)
                stat("学习中", learning, Theme.warning)
                stat("收藏", favorited, Theme.info)
                Spacer()
            }
        }
        .padding(16)
        .elevatedCard()
    }

    private func stat(_ label: String, _ v: Int, _ tint: Color) -> some View {
        HStack(spacing: 6) {
            Circle().fill(tint).frame(width: 6, height: 6)
            VStack(alignment: .leading, spacing: 0) {
                Text("\(v)").font(.system(size: 15, weight: .semibold, design: .monospaced)).foregroundStyle(Theme.fg)
                Text(label).font(.system(size: 10)).foregroundStyle(Theme.fgMuted)
            }
        }
    }

    private var themePreference: AppThemePreference {
        get { AppThemePreference(rawValue: appThemePreferenceRaw) ?? .system }
        nonmutating set { appThemePreferenceRaw = newValue.rawValue }
    }

    private var accentPalette: AppAccentPalette {
        get { AppAccentPalette(rawValue: appAccentPaletteRaw) ?? .indigo }
        nonmutating set { appAccentPaletteRaw = newValue.rawValue }
    }

    @ViewBuilder
    private func section<C: View>(title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            KickerText(text: title)
            content()
        }
    }

    private var cloudCard: some View {
        VStack(spacing: 0) {
            infoRow("状态", value: cloud.isAvailable ? "已连接" : "未登录", tint: cloud.isAvailable ? Theme.success : Theme.danger)
            divider
            infoRow("上次同步", value: cloud.lastSyncAt.map { Self.fmt.string(from: $0) } ?? "—")
            divider
            HStack(spacing: 10) {
                Button { cloud.push(progresses) } label: {
                    buttonLabel(icon: "arrow.up", title: "推送", primary: true)
                }.buttonStyle(.pressable)
                Button { mergeFromCloud() } label: {
                    buttonLabel(icon: "arrow.down", title: "拉取合并", primary: false)
                }.buttonStyle(.pressable)
            }
            .padding(14)
        }
        .elevatedCard()
    }

    private var appearanceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("选择你更舒服的阅读环境。")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)

            HStack(spacing: 10) {
                ForEach(AppThemePreference.allCases) { option in
                    Button {
                        themePreference = option
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: option.icon)
                                .font(.system(size: 16, weight: .semibold))
                            Text(option.title)
                                .font(.system(size: 11, weight: .semibold))
                                .multilineTextAlignment(.center)
                        }
                        .foregroundStyle(themePreference == option ? .white : Theme.fg)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .fill(themePreference == option ? Theme.accent : Theme.base2)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .stroke(themePreference == option ? Color.clear : Theme.border, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.pressable)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                KickerText(text: "Palette")
                HStack(spacing: 10) {
                    ForEach(AppAccentPalette.allCases) { palette in
                        Button {
                            accentPalette = palette
                        } label: {
                            VStack(spacing: 8) {
                                Circle()
                                    .fill(Color(hex: palette.preview.light))
                                    .frame(width: 22, height: 22)
                                    .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                                Text(palette.title)
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundStyle(accentPalette == palette ? .white : Theme.fg)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                    .fill(accentPalette == palette ? Theme.accent : Theme.base2)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                    .stroke(accentPalette == palette ? Color.clear : Theme.border, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.pressable)
                    }
                }
            }
        }
        .padding(16)
        .elevatedCard()
    }

    private var libraryCard: some View {
        VStack(spacing: 0) {
            infoRow("分类数", value: "\(store.categories.count)")
            divider
            infoRow("题目总数", value: "\(store.totalCount)")
        }
        .elevatedCard()
    }

    private var aboutCard: some View {
        VStack(spacing: 0) {
            infoRow("版本", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "-")
            divider
            Link(destination: URL(string: "https://github.com/can4hou6joeng4/interview-prep")!) {
                HStack {
                    Text("仓库首页")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.fg)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.fgDim)
                }
                .padding(.horizontal, 14).padding(.vertical, 12)
            }
        }
        .elevatedCard()
    }

    private var openSourceCard: some View {
        VStack(spacing: 0) {
            openSourceLink(
                title: "查看 Issues",
                subtitle: "看看还有哪些功能和问题正在推进",
                url: "https://github.com/can4hou6joeng4/interview-prep/issues"
            )
            divider
            openSourceLink(
                title: "查看 Changelog",
                subtitle: "追踪题库和产品迭代记录",
                url: "https://github.com/can4hou6joeng4/interview-prep/blob/main/CHANGELOG.md"
            )
        }
        .elevatedCard()
    }

    private func infoRow(_ label: String, value: String, tint: Color? = nil) -> some View {
        HStack {
            Text(label).font(.system(size: 13)).foregroundStyle(Theme.fgMuted)
            Spacer()
            HStack(spacing: 6) {
                if let tint = tint {
                    Circle().fill(tint).frame(width: 5, height: 5)
                }
                Text(value).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.fg)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 11)
    }

    private var divider: some View {
        Rectangle().fill(Theme.border).frame(height: 0.5).padding(.leading, 14)
    }

    private func openSourceLink(title: String, subtitle: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.fg)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.fgDim)
                }
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.fgMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func buttonLabel(icon: String, title: String, primary: Bool) -> some View {
        BrutalButtonLabel(
            title: title,
            icon: icon,
            bg: primary ? Theme.accent : Theme.chrome,
            fg: primary ? .white : Theme.fg,
            fullWidth: true
        )
    }

    private static let fmt: DateFormatter = {
        let f = DateFormatter(); f.dateStyle = .short; f.timeStyle = .short; return f
    }()

    private func mergeFromCloud() {
        guard let snap = cloud.pull() else { return }
        let byId = Dictionary(uniqueKeysWithValues: progresses.map { ($0.questionId, $0) })
        for item in snap.items {
            if let existing = byId[item.id] {
                existing.status = max(existing.status, item.status)
                existing.favorited = existing.favorited || item.favorited
                if existing.note.isEmpty { existing.note = item.note }
                if let noteUpdated = item.noteUpdatedAt,
                   existing.noteUpdatedAt == nil || existing.noteUpdatedAt! < noteUpdated {
                    existing.noteUpdatedAt = noteUpdated
                }
                if let viewed = item.viewed, (existing.lastViewedAt == nil || existing.lastViewedAt! < viewed) {
                    existing.lastViewedAt = viewed
                }
            } else {
                ctx.insert(UserProgress(
                    questionId: item.id,
                    status: item.status,
                    favorited: item.favorited,
                    note: item.note,
                    lastViewedAt: item.viewed,
                    noteUpdatedAt: item.noteUpdatedAt
                ))
            }
        }
        try? ctx.save()
    }
}
