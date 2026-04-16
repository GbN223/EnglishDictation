export default function VoiceWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-8" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${
            isActive
              ? 'bg-primary waveform-bar'
              : 'bg-muted-foreground/30 h-1'
          }`}
          style={
            isActive
              ? {
                  animationDuration: `${0.8 + i * 0.15}s`,
                  height: '100%',
                }
              : { height: '4px' }
          }
        />
      ))}
    </div>
  );
}
