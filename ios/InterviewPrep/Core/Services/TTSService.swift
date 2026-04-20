import Foundation
import AVFoundation
import Combine
import UIKit

@MainActor
final class TTSService: NSObject, ObservableObject {
    static let shared = TTSService()

    @Published private(set) var isSpeaking: Bool = false
    @Published private(set) var currentQuestionId: String?

    private let synthesizer = AVSpeechSynthesizer()

    override private init() {
        super.init()
        synthesizer.delegate = self
        configureAudioSession()
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers, .duckOthers])
        try? session.setActive(true)
    }

    func speak(question: Question) {
        stop()
        let plain = Self.plainText(fromHTML: question.a)
        let text = question.q + "。答案如下。" + plain
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-CN")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95
        utterance.pitchMultiplier = 1.0
        currentQuestionId = question.id
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        isSpeaking = false
        currentQuestionId = nil
    }

    func pauseOrResume() {
        if synthesizer.isPaused {
            synthesizer.continueSpeaking()
        } else if synthesizer.isSpeaking {
            synthesizer.pauseSpeaking(at: .word)
        }
    }

    static func plainText(fromHTML html: String) -> String {
        guard let data = html.data(using: .utf8) else { return html }
        let opts: [NSAttributedString.DocumentReadingOptionKey: Any] = [
            .documentType: NSAttributedString.DocumentType.html,
            .characterEncoding: String.Encoding.utf8.rawValue
        ]
        if let attr = try? NSAttributedString(data: data, options: opts, documentAttributes: nil) {
            return attr.string
        }
        return html
    }
}

extension TTSService: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = true }
    }
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.currentQuestionId = nil
        }
    }
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            self.currentQuestionId = nil
        }
    }
}
