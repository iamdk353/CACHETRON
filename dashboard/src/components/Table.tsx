"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------ Type ------------------ */
export type CacheMetricRow = {
  time: string;
  hitRatio: number;
  missRatio: number;
  hitRatioLifetime: number;
  missRatioLifetime: number;
  cacheSize?: number;
  dataChangeRate?: number;
  keyCount?: number;
  avgKeySize?: number;
};

/* ------------------ Columns ------------------ */
const columns: ColumnDef<CacheMetricRow>[] = [
  {
    accessorKey: "time",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Time <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.getValue<string>("time")).toLocaleTimeString(),
  },
  {
    accessorKey: "hitRatio",
    header: "Hit %",
    cell: ({ row }) => `${Math.round(row.getValue<number>("hitRatio") * 100)}%`,
  },
  {
    accessorKey: "missRatio",
    header: "Miss %",
    cell: ({ row }) =>
      `${Math.round(row.getValue<number>("missRatio") * 100)}%`,
  },
  {
    accessorKey: "hitRatioLifetime",
    header: "Hit % (Lifetime)",
    cell: ({ row }) =>
      `${Math.round(row.getValue<number>("hitRatioLifetime") * 100)}%`,
  },
  {
    accessorKey: "missRatioLifetime",
    header: "Miss % (Lifetime)",
    cell: ({ row }) =>
      `${Math.round(row.getValue<number>("missRatioLifetime") * 100)}%`,
  },
  {
    accessorKey: "cacheSize",
    header: "Cache Size (MB)",
  },
  {
    accessorKey: "keyCount",
    header: "Keys",
  },
  {
    accessorKey: "avgKeySize",
    header: "Avg Key Size (bytes)",
  },
];

/* ------------------ Component ------------------ */
type Props = {
  data: CacheMetricRow[];
};

const CacheMetricsTable: React.FC<Props> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border m-10">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CacheMetricsTable;
