import SwiftUI

// MARK: - Theme (Modern Dark / Linear-inspired)
enum Theme {
    // Backgrounds (never pure #000, avoids OLED smear)
    static let base       = Color(hex: 0x050506)
    static let elevated   = Color(hex: 0x0A0A0C)
    static let elevated2  = Color(hex: 0x101013)
    static let surface    = Color.white.opacity(0.045)
    static let surfaceHi  = Color.white.opacity(0.08)

    // Foreground
    static let fg         = Color(hex: 0xEDEDEF)
    static let fgMuted    = Color(hex: 0x8A8F98)
    static let fgDim      = Color(hex: 0x5A5F68)

    // Border (hairline)
    static let border     = Color.white.opacity(0.08)
    static let borderHi   = Color.white.opacity(0.14)

    // Accent
    static let accent     = Color(hex: 0x5E6AD2)        // Linear purple-blue
    static let accentHi   = Color(hex: 0x7C88E0)
    static let accentDim  = Color(hex: 0x3D48A8)
    static let accentGlow = Color(hex: 0x5E6AD2).opacity(0.2)

    // Semantic (muted, not candy)
    static let success    = Color(hex: 0x4ADE80)
    static let warning    = Color(hex: 0xFACC15)
    static let danger     = Color(hex: 0xEF4444)
    static let info       = Color(hex: 0x60A5FA)

    // MARK: Helpers
    static func diffColor(_ diff: String) -> Color {
        switch diff {
        case "easy":   return success
        case "medium": return warning
        case "hard":   return danger
        default:       return fgDim
        }
    }

    static func diffLabel(_ diff: String) -> String {
        switch diff {
        case "easy":   return "EASY"
        case "medium": return "MED"
        case "hard":   return "HARD"
        default:       return "—"
        }
    }

    // Map optional category hex to accent variant (subtly colored)
    static func categoryTint(_ hex: String) -> Color {
        Color(hexString: hex)?.opacity(0.9) ?? accent
    }

    // Motion
    static let pressSpring = Animation.interactiveSpring(response: 0.28, dampingFraction: 0.72)
    static let ease = Animation.timingCurve(0.16, 1, 0.3, 1, duration: 0.28)

    // Radius
    static let r: CGFloat = 16
    static let rSm: CGFloat = 10
    static let rXs: CGFloat = 6
}

// MARK: - Modifiers

struct ElevatedCard: ViewModifier {
    var bg: Color = Theme.elevated
    var radius: CGFloat = Theme.r
    var hairline: Bool = true
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous).fill(bg)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Theme.border, lineWidth: hairline ? 0.5 : 0)
            )
    }
}

struct AccentGlow: ViewModifier {
    var radius: CGFloat = Theme.r
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(Theme.accent)
                    .blur(radius: 18)
                    .opacity(0.45)
                    .padding(-4)
            )
    }
}

extension View {
    func elevatedCard(bg: Color = Theme.elevated, radius: CGFloat = Theme.r, hairline: Bool = true) -> some View {
        modifier(ElevatedCard(bg: bg, radius: radius, hairline: hairline))
    }
    func accentGlow(radius: CGFloat = Theme.r) -> some View {
        modifier(AccentGlow(radius: radius))
    }
}

// MARK: - Pressable Scale Button Style

struct PressableScale: ButtonStyle {
    var scale: CGFloat = 0.97
    var opacity: CGFloat = 0.92
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1.0)
            .opacity(configuration.isPressed ? opacity : 1.0)
            .animation(Theme.pressSpring, value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PressableScale {
    static var pressable: PressableScale { PressableScale() }
}

// MARK: - Small components

struct KickerText: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .tracking(0.8)
            .textCase(.uppercase)
            .foregroundStyle(Theme.fgMuted)
    }
}

struct DifficultyChip: View {
    let diff: String
    var body: some View {
        HStack(spacing: 4) {
            Circle().fill(Theme.diffColor(diff)).frame(width: 5, height: 5)
            Text(Theme.diffLabel(diff))
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.4)
                .foregroundStyle(Theme.fgMuted)
        }
        .padding(.horizontal, 7).padding(.vertical, 3)
        .background(
            Capsule().fill(Theme.surface)
        )
        .overlay(
            Capsule().strokeBorder(Theme.border, lineWidth: 0.5)
        )
    }
}

// Back-compat alias so old code compiles; new code should use DifficultyChip
typealias DifficultyBadge = DifficultyChip

struct ThinProgressBar: View {
    let progress: Double    // 0...1
    var height: CGFloat = 4
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.surface)
                Capsule().fill(
                    LinearGradient(colors: [Theme.accent, Theme.accentHi], startPoint: .leading, endPoint: .trailing)
                )
                .frame(width: geo.size.width * max(0, min(1, progress)))
                .animation(Theme.ease, value: progress)
            }
        }
        .frame(height: height)
    }
}

struct TagChip: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(Theme.fgMuted)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(Capsule().fill(Theme.surface))
            .overlay(Capsule().strokeBorder(Theme.border, lineWidth: 0.5))
    }
}

// MARK: - Color helpers

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xff) / 255
        let g = Double((hex >> 8)  & 0xff) / 255
        let b = Double( hex        & 0xff) / 255
        self.init(red: r, green: g, blue: b)
    }
    init?(hexString raw: String) {
        var s = raw.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(hex: v)
    }
}
