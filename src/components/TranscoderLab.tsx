import React, { useState, useEffect } from 'react';
import { HwEngine, AppLanguage, TranscodeProfile } from '../types/media';
import { translations } from '../i18n/translations';
import { TRANSCODE_PROFILES } from '../data/mockMedia';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Sliders,
  Play,
  RotateCw,
  HardDrive,
  Flame,
  ShieldCheck,
  Server
} from 'lucide-react';

interface TranscoderLabProps {
  language: AppLanguage;
  selectedHwEngine: HwEngine;
  onSelectHwEngine: (engine: HwEngine) => void;
}

export const TranscoderLab: React.FC<TranscoderLabProps> = ({
  language,
  selectedHwEngine,
  onSelectHwEngine,
}) => {
  const [toneMappingAlgo, setToneMappingAlgo] = useState<'hable' | 'reinhard' | 'mobius'>('hable');
  const [colorGamutConvert, setColorGamutConvert] = useState(true);
  const [ramDiskBuffer, setRamDiskBuffer] = useState(true);
  const [throttleSpeed, setThrottleSpeed] = useState(4.0);

  // Live telemetry metrics
  const [gpuLoad, setGpuLoad] = useState(34);
  const [transcodeFps, setTranscodeFps] = useState(148);
  const [vramMb, setVramMb] = useState(2140);
  const [tempC, setTempC] = useState(52);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);

  const t = translations[language];

  // Dynamic simulation of GPU load
  useEffect(() => {
    const timer = setInterval(() => {
      setGpuLoad(Math.round(30 + Math.random() * 12));
      setTranscodeFps(Math.round(140 + Math.random() * 18));
      setVramMb(Math.round(2100 + Math.random() * 80));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const runBenchmark = () => {
    setBenchmarking(true);
    setBenchmarkResult(null);

    setTimeout(() => {
      setBenchmarking(false);
      setBenchmarkResult(
        `基准测试完成: ${selectedHwEngine} 测得峰值 4K HEVC 转码速度为 184.6 FPS (7.69x 倍速)，显存带宽吞吐 48.2 GB/s，端到端转码延迟 14.2ms，达到广播级硬件加速评级。`
      );
    }, 3200);
  };

  const hwEngines: { id: HwEngine; name: string; desc: string; supportedCodecs: string }[] = [
    {
      id: 'NVENC',
      name: 'NVIDIA NVENC (GeForce RTX / Quadro)',
      desc: '专为 RTX 40/30 系列优化的高性能双编码器管线，支持第 8 代 NVENC 硬件 AV1 及 HEVC 10-bit 超低延迟编码。',
      supportedCodecs: 'AV1, HEVC, H.264, VP9',
    },
    {
      id: 'Intel QSV',
      name: 'Intel QuickSync Video (Xe / Arc / Core)',
      desc: '利用第 12-14 代酷睿及 Arc 独立显卡的专有媒体处理引擎，卓越的能效比与极速 HEVC/AV1 硬件直解。',
      supportedCodecs: 'AV1, HEVC, H.264',
    },
    {
      id: 'Apple VideoToolbox',
      name: 'Apple VideoToolbox (Metal 3 / Apple Silicon)',
      desc: 'Apple M1/M2/M3/M4 系列芯片专有媒体引擎，零拷贝共享内存架构，功耗低至 3W。',
      supportedCodecs: 'HEVC 10-bit, ProRes, H.264',
    },
    {
      id: 'VAAPI',
      name: 'Linux VA-API / AMD AMF (Radeon / Mesa)',
      desc: '适用于 Linux 内核的通用开源视频加速 API，全面兼容 AMD Radeon 及 Intel 开源核显驱动。',
      supportedCodecs: 'HEVC, H.264, VP9',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>{t.transcoderTitle}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            {t.transcoderDesc}
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={benchmarking}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg shadow-md transition-all self-start sm:self-auto"
        >
          <Zap className={`w-3.5 h-3.5 ${benchmarking ? 'animate-bounce' : ''}`} />
          <span>{benchmarking ? t.benchmarking : t.runBenchmark}</span>
        </button>
      </div>

      {/* Benchmark Result Alert if available */}
      {benchmarkResult && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>{benchmarkResult}</p>
        </div>
      )}

      {/* Live Hardware Telemetry Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <span className="text-[11px] font-mono text-neutral-400 block mb-1">实时转码吞吐 (FPS)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{transcodeFps}</span>
            <span className="text-xs text-neutral-500 font-mono">FPS (6.2x)</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-2">支持 4 路并发 4K HDR 转码</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <span className="text-[11px] font-mono text-neutral-400 block mb-1">GPU 专用编码引擎</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{gpuLoad}%</span>
            <span className="text-xs text-emerald-400 font-mono">负载健康</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${gpuLoad}%` }} />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <span className="text-[11px] font-mono text-neutral-400 block mb-1">显存占用 (VRAM)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-400 font-mono">{vramMb}</span>
            <span className="text-xs text-neutral-500 font-mono">/ 8192 MB</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full" style={{ width: `${(vramMb / 8192) * 100}%` }} />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <span className="text-[11px] font-mono text-neutral-400 block mb-1">硬件核心温度</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-200 font-mono">{tempC} °C</span>
            <span className="text-xs text-emerald-400 font-mono">风扇静音模式</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-2">热控功耗 ~38W</div>
        </div>
      </div>

      {/* Hardware Backend Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>选择当前平台硬件加速编解码管线</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hwEngines.map((engine) => {
            const isSelected = selectedHwEngine === engine.id;
            return (
              <div
                key={engine.id}
                onClick={() => onSelectHwEngine(engine.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                    {engine.name}
                  </h4>
                  {isSelected && (
                    <span className="text-[10px] text-amber-300 font-mono font-semibold">
                      当前激活
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                  {engine.desc}
                </p>
                <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5 pt-2 border-t border-neutral-800/60">
                  <span className="text-neutral-400">支持格式:</span>
                  <span className="text-neutral-300">{engine.supportedCodecs}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tone Mapping & Advanced Transcoding Options */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>硬件级 HDR 动态色调映射与缓冲策略</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Tone mapping algorithm */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
            <label className="text-neutral-400 block font-mono">HDR 映射曲线算法</label>
            <select
              value={toneMappingAlgo}
              onChange={(e) => setToneMappingAlgo(e.target.value as any)}
              className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded p-2 text-xs focus:outline-none"
            >
              <option value="hable">Hable Filmic (电影级胶片质感高光保留)</option>
              <option value="reinhard">Reinhard (自然中间调饱和度平衡)</option>
              <option value="mobius">Mobius (高动态线性压缩)</option>
            </select>
          </div>

          {/* Gamut Convert */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-neutral-400 block font-mono">广色域色彩空间转换</span>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={colorGamutConvert}
                onChange={(e) => setColorGamutConvert(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span className="text-neutral-300">BT.2020 自动映射至 BT.709</span>
            </label>
          </div>

          {/* RAM disk cache */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-neutral-400 block font-mono">临时转码缓冲介质</span>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={ramDiskBuffer}
                onChange={(e) => setRamDiskBuffer(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span className="text-neutral-300">使用内存盘 /dev/shm (零磁盘磨损)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
