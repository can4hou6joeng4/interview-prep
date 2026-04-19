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

// MARK: - Theme (Native Study Tool, adaptive)
enum Theme {
    static let base = Color(light: 0xF6F7FB, dark: 0x0B1220)
    static let base2 = Color(light: 0xEEF2FF, dark: 0x111B31)
    static let surface = Color(light: 0xFFFFFF, dark: 0x162033)
    static let chrome = Color(light: 0xE0E7FF, dark: 0x1A2440)
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

    static let accent = Color(light: 0x4F46E5, dark: 0x818CF8)
    static let accentHi = Color(light: 0x6366F1, dark: 0xA5B4FC)
    static let accentDim = Color(light: 0x4338CA, dark: 0xC7D2FE)
    static let success = Color(light: 0xD1FAE5, dark: 0x10372B)
    static let successSolid = Color(light: 0x10B981, dark: 0x34D399)
    static let warning = Color(light: 0xFEF3C7, dark: 0x4A3514)
    static let warningSolid = Color(light: 0xF59E0B, dark: 0xFBBF24)
    static let danger = Color(light: 0xFEE2E2, dark: 0x4A1F28)
    static let dangerSolid = Color(light: 0xEF4444, dark: 0xFB7185)
    static let info = Color(light: 0xDBEAFE, dark: 0x172554)
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
