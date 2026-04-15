import { Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface TradeFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  assetFilter: string;
  onAssetFilterChange: (value: string) => void;
  assets: string[];
}

export function TradeFilters({
  query,
  onQueryChange,
  assetFilter,
  onAssetFilterChange,
  assets,
}: TradeFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
      <div className="md:col-span-8">
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por activo o estrategia"
          allowClear
        />
      </div>

      <div className="md:col-span-4">
        <Select
          value={assetFilter}
          style={{ width: "100%" }}
          onChange={onAssetFilterChange}
          options={assets.map((asset) => ({
            value: asset,
            label: asset === "all" ? "Todos los activos" : asset,
          }))}
        />
      </div>
    </div>
  );
}
