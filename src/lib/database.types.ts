export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      backtests: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          strategy_name: string;
          strategy_description: string | null;
          timeframe: string;
          start_date: string;
          end_date: string;
          initial_capital: number;
          total_return: number | null;
          max_drawdown: number | null;
          win_rate: number | null;
          profit_factor: number | null;
          total_trades: number | null;
          sharpe_ratio: number | null;
          notes: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          asset: string;
          strategy_name: string;
          strategy_description?: string | null;
          timeframe: string;
          start_date: string;
          end_date: string;
          initial_capital: number;
          total_return?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          sharpe_ratio?: number | null;
          notes?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          strategy_name?: string;
          strategy_description?: string | null;
          timeframe?: string;
          start_date?: string;
          end_date?: string;
          initial_capital?: number;
          total_return?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          sharpe_ratio?: number | null;
          notes?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type BacktestRow = Database["public"]["Tables"]["backtests"]["Row"];
export type BacktestInsert = Database["public"]["Tables"]["backtests"]["Insert"];
