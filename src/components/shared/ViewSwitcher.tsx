import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, FileText, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// 定义视图模式的类型
export type ViewMode = 'edit' | 'proposal' | 'line';

// 定义视图选项的接口，移除了与路由强耦合的 'path' 属性
// [architect] 3. 配置選項硬編碼 (中) - 这个结构现在通过 props 传递
// [architect] 2. 重複的邏輯實現 (中) - 保证了单一的定义来源
interface ViewOption {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// [designer] 2. 動態按鈕效果直接寫在元件內，未抽離成可配置的動態參數 (中)
// 定义默认的按钮动态效果参数，现在可以被 props 覆盖
const DEFAULT_BUTTON_MOTION_PROPS = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

// 定义活动指示器的默认过渡效果参数，现在可以被 props 覆盖
const ACTIVE_INDICATOR_MOTION_TRANSITION = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// Kintone 獨立性 (架構) - 使用 {file_path_name}Config 命名 props 接口
// [architect] 1. 路由邏輯與 UI 元件耦合 (中) - 路由逻辑通过 onSwitch 回调函数抽象
// [architect] 2. 重複的邏輯實現 (中) - activeViewId 和 options 现在作为 props 传入
// [architect] 3. 配置選項硬編碼 (中) - options 列表通过 props 传入
// [architect] 4. 元件職責單一性 (中) - 组件只负责 UI 渲染和事件触发，不直接处理路由
interface ViewSwitcherConfig {
  /** 视图选项的列表。 */
  options: ViewOption[];
  /** 当前激活的视图模式 ID。 */
  activeViewId: ViewMode;
  /** 切换视图时调用的回调函数。接收选定视图的 ID。 */
  onSwitch: (id: ViewMode) => void;
  /** 应用到容器的额外 CSS 类名。 */
  className?: string;
  /** 可选的按钮动态效果属性 (如 whileHover, whileTap)。 */
  buttonMotionProps?: typeof DEFAULT_BUTTON_MOTION_PROPS;
  /** 可选的活动指示器动画过渡属性。 */
  activeIndicatorTransition?: typeof ACTIVE_INDICATOR_MOTION_TRANSITION;
}

// 主要的 ViewSwitcher 组件，整合了桌面和移动端的响应式设计
export default function ViewSwitcher({
  options,
  activeViewId,
  onSwitch,
  className,
  buttonMotionProps = DEFAULT_BUTTON_MOTION_PROPS,
  activeIndicatorTransition = ACTIVE_INDICATOR_MOTION_TRANSITION,
}: ViewSwitcherConfig) {

  // 为紧凑（select）版本查找当前激活的选项，以便显示正确的图标
  const currentOption = options.find(o => o.id === activeViewId);

  return (
    // [designer] 3. 缺少 RWD 斷點處理的完整性檢查 (中) - 将紧凑版本合并到主组件中
    // [designer] 1. 直接使用 bg-slate-100 等颜色 class，未使用设计系统定义色阶 (中)
    // 应用响应式类名，根据屏幕尺寸切换布局
    <div className={cn('relative', className)}>
      {/* 完整版本：适用于较大屏幕（sm 及以上），显示为按钮组 */}
      <div className={cn('hidden sm:flex items-center gap-1 p-1 rounded-lg', 'bg-muted')}> {/* bg-slate-100 替换为 bg-muted */}
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = activeViewId === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => onSwitch(option.id)}
              {...buttonMotionProps} // [designer] 2. 可配置的动态参数
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200', // 添加 transition-colors 和 duration
                isActive
                  ? 'text-primary-600' // text-brand-600 替换为 text-primary-600 (假设 brand 映射到 primary)
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50' // text-slate-500 替换为 text-muted-foreground, hover:text-slate-700 替换为 hover:text-foreground, hover:bg-slate-50 替换为 hover:bg-muted/50
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="viewSwitcherActive"
                  className={cn(
                    'absolute inset-0 rounded-lg shadow-sm', // [designer] 4. shadow-sm 是 Tailwind 的 token，如果设计系统有更语义化的变量应使用，否则 shadow-sm 符合规范
                    'bg-background' // bg-white 替换为 bg-background
                  )}
                  initial={false}
                  transition={activeIndicatorTransition} // [designer] 2. 可配置的动态参数
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span> {/* sm:inline 用于在小屏幕上隐藏标签，在大屏幕上显示 */}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 紧凑版本：适用于小屏幕（小于 sm），显示为下拉选择框 */}
      <div className="sm:hidden relative">
        <select
          value={activeViewId}
          onChange={(e) => onSwitch(e.target.value as ViewMode)}
          className={cn(
            "appearance-none text-sm font-medium px-4 py-2 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2",
            "bg-muted text-foreground focus:ring-primary-500/20" // bg-slate-100 替换为 bg-muted, text-slate-700 替换为 text-foreground, focus:ring-brand-500/20 替换为 focus:ring-primary-500/20
          )}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        {/* 如果找到当前选项且有图标，则显示图标 */}
        {currentOption?.icon && (
          <currentOption.icon className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
            "text-muted-foreground" // text-slate-500 替换为 text-muted-foreground
          )} />
        )}
      </div>
    </div>
  );
}