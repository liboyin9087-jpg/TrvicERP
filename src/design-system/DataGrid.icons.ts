/**
 * DataGrid Icons
 * Provides default icon components from Lucide React
 */

import {
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  Filter,
  Columns,
} from 'lucide-react';

export const defaultDataGridIcons = {
  sortAsc: ChevronUp,
  sortDesc: ChevronDown,
  search: Search,
  close: X,
  add: Plus,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  download: Download,
  upload: Upload,
  settings: Settings,
  filter: Filter,
  columns: Columns,
};

export const ICON_MAP = defaultDataGridIcons;
