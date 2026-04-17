import SwiftUI

enum Theme {
    // MARK: Colors (from assets/styles.css :root)
    static let bg        = Color(hex: 0xFFFDF7)
    static let bg2       = Color(hex: 0xFFF8E8)
    static let surface   = Color.white
    static let border    = Color(hex: 0x222222)
    static let text      = Color(hex: 0x1A1A2E)
    static let text2     = Color(hex: 0x444444)
    static let text3     = Color(hex: 0x777777)

    static let pink      = Color(hex: 0xFF6B9D)
    static let yellow    = Color(hex: 0xFFE156)
    static let blue      = Color(hex: 0x4ECDC4)
    static let green     = Color(hex: 0xA8E6CF)
    static let orange    = Color(hex: 0xFF8A5C)
    static let purple    = Color(hex: 0xC3A6FF)
    static let cyan      = Color(hex: 0x56C2E6)
    static let red       = Color(hex: 0xFF6B6B)
    static let lime      = Color(hex: 0xC7F464)

    static let greenSolid  = Color(hex: 0x2ECC71)
    static let orangeSolid = Color(hex: 0xF39C12)
    static let redSolid    = Color(hex: 0xE74C3C)
    static let cyanSolid   = Color(hex: 0x3498DB)

    // MARK: Semantic
    static func diffColor(_ diff: String) -> Color {
        switch diff {
        case "easy": return greenSolid
        case "medium": return orangeSolid
        case "hard": return redSolid
        default: return text3
        }
    }

    /// Map a hex string from data.js (e.g. "#6c8cff") to Color, fallback to pink
    static func categoryColor(_ hex: String) -> Color {
        Color(hexString: hex) ?? pink
    }
}

// MARK: - Neo-Brutalism modifiers

struct NeoBorder: ViewModifier {
    var width: CGFloat = 3
    var color: Color = Theme.border
    func body(content: Content) -> some View {
        content.overlay(
            Rectangle().stroke(color, lineWidth: width)
        )
    }
}

struct NeoShadow: ViewModifier {
    var offset: CGFloat = 4
    var color: Color = Theme.border
    func body(content: Content) -> some View {
        // 背景层矩形伪阴影，避免 SwiftUI `.shadow` 对子 Text 产生鬼影
        content.background(
            color
                .offset(x: offset, y: offset)
        )
    }
}

extension View {
    func neoBorder(_ width: CGFloat = 3, color: Color = Theme.border) -> some View {
        modifier(NeoBorder(width: width, color: color))
    }
    func neoShadow(offset: CGFloat = 4) -> some View {
        modifier(NeoShadow(offset: offset))
    }
    func neoCard(bg: Color = Theme.surface, offset: CGFloat = 4) -> some View {
        self.padding(14)
            .background(bg)
            .neoBorder()
            .neoShadow(offset: offset)
    }
}

// MARK: - Kicker (uppercase small label)

struct KickerText: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .heavy))
            .tracking(1.5)
            .textCase(.uppercase)
            .foregroundStyle(Theme.text2)
    }
}

// MARK: - Diff badge

struct DifficultyBadge: View {
    let diff: String
    var body: some View {
        Text(diff.uppercased())
            .font(.system(size: 10, weight: .black))
            .tracking(0.5)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .foregroundStyle(.white)
            .background(Theme.diffColor(diff))
            .overlay(Rectangle().stroke(Theme.border, lineWidth: 2))
    }
}

// MARK: - Striped progress (pink/yellow 45deg stripes from CSS)

struct StripedProgressBar: View {
    let progress: Double    // 0...1
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Rectangle().fill(Theme.bg2)
                Rectangle()
                    .fill(
                        LinearGradient(
                            stops: stripeStops(),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: geo.size.width * max(0, min(1, progress)))
                    .animation(.easeOut(duration: 0.4), value: progress)
            }
        }
        .frame(height: 8)
        .overlay(Rectangle().stroke(Theme.border, lineWidth: 2))
    }
    private func stripeStops() -> [Gradient.Stop] {
        // Approximate diagonal pink/yellow stripe using many stops
        var out: [Gradient.Stop] = []
        let n = 24
        for i in 0..<n {
            let t = Double(i) / Double(n)
            out.append(.init(color: i.isMultiple(of: 2) ? Theme.pink : Theme.yellow, location: t))
        }
        return out
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
