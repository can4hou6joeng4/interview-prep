import SwiftUI
import UIKit

enum AppThemePreference: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var title: String {
        switch self {
        case .system: return "跟随系统"
        case .light: return "浅色"
        case .dark: return "深色"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max"
        case .dark: return "moon.stars"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

enum AppAccentPalette: String, CaseIterable, Identifiable {
    case indigo
    case ocean
    case sunset
    case forest

    var id: String { rawValue }

    var title: String {
        switch self {
        case .indigo: return "默认"
        case .ocean: return "海洋"
        case .sunset: return "日落"
        case .forest: return "森林"
        }
    }

    var preview: (light: UInt32, dark: UInt32) {
        switch self {
        case .indigo: return (0x4F46E5, 0x818CF8)
        case .ocean: return (0x0891B2, 0x22D3EE)
        case .sunset: return (0xEA580C, 0xFB923C)
        case .forest: return (0x15803D, 0x4ADE80)
        }
    }
}

private struct ThemePalette {
    let accentLight: UInt32
    let accentDark: UInt32
    let accentHiLight: UInt32
    let accentHiDark: UInt32
    let accentDimLight: UInt32
    let accentDimDark: UInt32
    let chromeLight: UInt32
    let chromeDark: UInt32
    let base2Light: UInt32
    let base2Dark: UInt32
    let infoLight: UInt32
    let infoDark: UInt32
}

// MARK: - Theme (Native Study Tool, adaptive)
enum Theme {
    private static var currentPalette: ThemePalette {
        let raw = UserDefaults.standard.string(forKey: "appAccentPalette") ?? AppAccentPalette.indigo.rawValue
        let palette = AppAccentPalette(rawValue: raw) ?? .indigo
        switch palette {
        case .indigo:
            return ThemePalette(
                accentLight: 0x4F46E5, accentDark: 0x818CF8,
                accentHiLight: 0x6366F1, accentHiDark: 0xA5B4FC,
                accentDimLight: 0x4338CA, accentDimDark: 0xC7D2FE,
                chromeLight: 0xE0E7FF, chromeDark: 0x1A2440,
                base2Light: 0xEEF2FF, base2Dark: 0x111B31,
                infoLight: 0xDBEAFE, infoDark: 0x172554
            )
        case .ocean:
            return ThemePalette(
                accentLight: 0x0891B2, accentDark: 0x22D3EE,
                accentHiLight: 0x06B6D4, accentHiDark: 0x67E8F9,
                accentDimLight: 0x155E75, accentDimDark: 0xA5F3FC,
                chromeLight: 0xD9F5FB, chromeDark: 0x082F49,
                base2Light: 0xECFEFF, base2Dark: 0x0F172A,
                infoLight: 0xCFFAFE, infoDark: 0x083344
            )
        case .sunset:
            return ThemePalette(
                accentLight: 0xEA580C, accentDark: 0xFB923C,
                accentHiLight: 0xF97316, accentHiDark: 0xFDBA74,
                accentDimLight: 0x9A3412, accentDimDark: 0xFED7AA,
                chromeLight: 0xFFEDD5, chromeDark: 0x431407,
                base2Light: 0xFFF7ED, base2Dark: 0x2A1A11,
                infoLight: 0xFFEDD5, infoDark: 0x4A2C1D
            )
        case .forest:
            return ThemePalette(
                accentLight: 0x15803D, accentDark: 0x4ADE80,
                accentHiLight: 0x16A34A, accentHiDark: 0x86EFAC,
                accentDimLight: 0x166534, accentDimDark: 0xBBF7D0,
                chromeLight: 0xDCFCE7, chromeDark: 0x052E16,
                base2Light: 0xF0FDF4, base2Dark: 0x10231A,
                infoLight: 0xDCFCE7, infoDark: 0x163126
            )
        }
    }

    static let base = Color(light: 0xF6F7FB, dark: 0x0B1220)
    static var base2: Color { Color(light: currentPalette.base2Light, dark: currentPalette.base2Dark) }
    static let surface = Color(light: 0xFFFFFF, dark: 0x162033)
    static var chrome: Color { Color(light: currentPalette.chromeLight, dark: currentPalette.chromeDark) }
    static let chromeBorder = Color(light: 0xCBD5E1, dark: 0x334155)
    static let elevated = surface
    static let elevated2 = base2
    static let surfaceHi = chrome

    static let fg = Color(light: 0x0F172A, dark: 0xF8FAFC)
    static let fgMuted = Color(light: 0x475569, dark: 0xCBD5E1)
    static let fgDim = Color(light: 0x64748B, dark: 0x94A3B8)

    static let border = Color(light: 0xD7DCE5, dark: 0x2A3650)
    static let borderHi = Color(light: 0xB8C2D1, dark: 0x475569)
    static let shadow = Color(light: 0x000000, dark: 0x000000).opacity(0.14)
    static let borderWidth: CGFloat = 1.25

    static var accent: Color { Color(light: currentPalette.accentLight, dark: currentPalette.accentDark) }
    static var accentHi: Color { Color(light: currentPalette.accentHiLight, dark: currentPalette.accentHiDark) }
    static var accentDim: Color { Color(light: currentPalette.accentDimLight, dark: currentPalette.accentDimDark) }
    static let success = Color(light: 0xD1FAE5, dark: 0x10372B)
    static let successSolid = Color(light: 0x10B981, dark: 0x34D399)
    static let warning = Color(light: 0xFEF3C7, dark: 0x4A3514)
    static let warningSolid = Color(light: 0xF59E0B, dark: 0xFBBF24)
    static let danger = Color(light: 0xFEE2E2, dark: 0x4A1F28)
    static let dangerSolid = Color(light: 0xEF4444, dark: 0xFB7185)
    static var info: Color { Color(light: currentPalette.infoLight, dark: currentPalette.infoDark) }
    static let blue = Color(light: 0xCFE8FF, dark: 0x1E3A5F)
    static let purple = Color(light: 0xDDD6FE, dark: 0x2E2457)
    static let lime = Color(light: 0xD9F99D, dark: 0x365314)

    static let r: CGFloat = 20
    static let rSm: CGFloat = 14
    static let rXs: CGFloat = 10

    static let pressSpring = Animation.interactiveSpring(response: 0.25, dampingFraction: 0.82)
    static let ease = Animation.easeOut(duration: 0.24)

    static func diffColor(_ diff: String) -> Color {
        switch diff {
        case "easy":
            return success
        case "medium":
            return warning
        case "hard":
            return dangerSolid
        default:
            return chrome
        }
    }

    static func diffForeground(_ diff: String) -> Color {
        diff == "hard" ? .white : fg
    }

    static func diffLabel(_ diff: String) -> String {
        switch diff {
        case "easy": return "基础"
        case "medium": return "进阶"
        case "hard": return "深入"
        default: return "未分级"
        }
    }

    static func categoryTint(_ hex: String) -> Color {
        Color(hexString: hex) ?? accent
    }
}

// MARK: - Modifiers

struct ElevatedCard: ViewModifier {
    var bg: Color = Theme.surface
    var radius: CGFloat = Theme.r
    var shadowRadius: CGFloat = 10
    var lineWidth: CGFloat = Theme.borderWidth

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(bg)
                    .shadow(color: Theme.shadow, radius: shadowRadius, x: 0, y: 6)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Theme.border, lineWidth: lineWidth)
            )
    }
}

struct BrutalOutlined: ViewModifier {
    var bg: Color = Theme.base2
    var radius: CGFloat = Theme.rSm
    var lineWidth: CGFloat = 1

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(bg)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Theme.border, lineWidth: lineWidth)
            )
    }
}

struct AccentGlow: ViewModifier {
    func body(content: Content) -> some View {
        content
    }
}

extension View {
    func elevatedCard(bg: Color = Theme.surface, radius: CGFloat = Theme.r, hairline: Bool = true) -> some View {
        modifier(ElevatedCard(bg: bg, radius: radius, lineWidth: hairline ? Theme.borderWidth : 0))
    }

    func brutalOutlined(bg: Color = Theme.base2, radius: CGFloat = Theme.rSm, lineWidth: CGFloat = 1) -> some View {
        modifier(BrutalOutlined(bg: bg, radius: radius, lineWidth: lineWidth))
    }

    func accentGlow(radius: CGFloat = Theme.r) -> some View {
        modifier(AccentGlow())
    }
}

// MARK: - Pressable Button Style

struct PressableScale: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(configuration.isPressed ? 0.94 : 1.0)
            .animation(Theme.pressSpring, value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PressableScale {
    static var pressable: PressableScale { PressableScale() }
}

// MARK: - Shared Components

struct KickerText: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold))
            .tracking(1.6)
            .textCase(.uppercase)
            .foregroundStyle(Theme.fgDim)
    }
}

struct DifficultyChip: View {
    let diff: String

    var body: some View {
        Text(Theme.diffLabel(diff))
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(Theme.diffForeground(diff))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Theme.diffColor(diff)))
            .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
    }
}

typealias DifficultyBadge = DifficultyChip

struct ThinProgressBar: View {
    let progress: Double
    var height: CGFloat = 8

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.base2)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Theme.accent, Theme.accentHi],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * max(0, min(1, progress)))
                    .animation(Theme.ease, value: progress)
            }
            .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
        }
        .frame(height: height)
    }
}

struct TagChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(Theme.fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Theme.info))
            .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
    }
}

struct BrutalButtonLabel: View {
    let title: String
    var icon: String? = nil
    var bg: Color = Theme.accentHi
    var fg: Color = .white
    var fullWidth: Bool = false

    var body: some View {
        HStack(spacing: 8) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
            }
            Text(title)
                .font(.system(size: 13, weight: .semibold))
        }
        .foregroundStyle(fg)
        .frame(maxWidth: fullWidth ? .infinity : nil)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                .fill(bg)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: Theme.shadow, radius: 8, x: 0, y: 4)
    }
}

struct FloatingToast: View {
    let text: String
    var tint: Color = Theme.accent

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 13, weight: .semibold))
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .lineLimit(2)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            Capsule()
                .fill(tint)
        )
        .shadow(color: Theme.shadow, radius: 14, x: 0, y: 8)
    }
}

// MARK: - Color helpers

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xff) / 255
        let g = Double((hex >> 8) & 0xff) / 255
        let b = Double(hex & 0xff) / 255
        self.init(red: r, green: g, blue: b)
    }

    init(light: UInt32, dark: UInt32) {
        self.init(
            UIColor { trait in
                trait.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
            }
        )
    }

    init?(hexString raw: String) {
        var s = raw.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") {
            s.removeFirst()
        }
        guard s.count == 6, let v = UInt32(s, radix: 16) else {
            return nil
        }
        self.init(hex: v)
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        let r = CGFloat((hex >> 16) & 0xff) / 255
        let g = CGFloat((hex >> 8) & 0xff) / 255
        let b = CGFloat(hex & 0xff) / 255
        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}
