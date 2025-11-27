/**
 * Lucide Icons 映射
 * 用于替代 Font Awesome
 */

// 导出所有需要的 Lucide 图标
export {
  // 通用图标
  Search,
  Settings,
  Moon,
  Sun,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  
  // 操作图标
  Download,
  Upload,
  Share2,
  Save,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Link,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  
  // 社交/通信
  MessageCircle,
  Heart,
  Star,
  Crown,
  Github,
  
  // 文件/文档
  File,
  FileText,
  Folder,
  Image,
  
  // 用户/账户
  User,
  Users,
  UserPlus,
  LogIn,
  LogOut,
  
  // 商业/支付
  DollarSign,
  CreditCard,
  ShoppingCart,
  Coins,
  
  // 媒体/内容
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  
  // 状态/标记
  CheckCircle,
  XCircle,
  Circle,
  Loader,
  Zap,
  
  // 网络/数据
  Wifi,
  WifiOff,
  Server,
  Database,
  Cloud,
  
  // 导航/地图
  MapPin,
  Navigation,
  Compass,
  
  // 工具
  Wrench,
  Gauge,
  Package,
  Tag,
  Hash,
  Filter,
  
  // 速度/性能
  Rocket,
  Turtle,
  Layers,
  
  // 磁力/特殊
  Magnet,
  Sparkles,
  Wand2,
  Reply,
  List,
  LayoutGrid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Home,
  Gamepad2,
  MessageSquare,
  Bookmark,
  BookOpen,
  Music,
  Headphones,
  Palette,
  Paintbrush,
  Brush,
} from 'lucide-vue-next'

/**
 * 平台图标映射
 */
export const platformIcons = {
  lime: 'Star',
  white: 'Circle',
  gold: 'DollarSign',
  red: 'XCircle',
} as const

/**
 * 资源标签图标映射
 */
export const tagIcons = {
  NoReq: 'CheckCircle',
  Login: 'User',
  LoginPay: 'Coins',
  LoginRep: 'MessageCircle',
  Rep: 'Reply',
  SuDrive: 'Server',
  NoSplDrive: 'Rocket',
  SplDrive: 'Turtle',
  MixDrive: 'Layers',
  BTmag: 'Magnet',
  magic: 'Wand2',
} as const

