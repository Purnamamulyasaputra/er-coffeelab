"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

interface DataTableProps<T> {
  columns: {
    header: string
    accessorKey?: keyof T
    cell?: (item: T, index: number) => React.ReactNode
  }[]
  data: T[]
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
  dense?: boolean
}

export function DataTable<T>({ columns, data, keyExtractor, emptyMessage = "No results.", dense = false }: DataTableProps<T>) {
  const [showFilters, setShowFilters] = React.useState(false)
  const [rowsPerPage, setRowsPerPage] = React.useState(8)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortCol, setSortCol] = React.useState<number | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({})

  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      // Global Search
      if (globalSearch) {
        const matchesGlobal = Object.values(item as object).some(val => 
          String(val).toLowerCase().includes(globalSearch.toLowerCase())
        );
        if (!matchesGlobal) return false;
      }

      // Column Filters
      for (const col of columns) {
        const filterVal = columnFilters[col.header];
        if (filterVal) {
          const itemVal = col.accessorKey ? item[col.accessorKey] : (item as any)[col.header.toLowerCase()];
          if (!String(itemVal ?? "").toLowerCase().includes(filterVal.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, globalSearch, columnFilters, columns]);

  const sortedData = React.useMemo(() => {
    if (sortCol === null) return filteredData;
    const col = columns[sortCol];
    
    return [...filteredData].sort((a: any, b: any) => {
      let valA = col.accessorKey ? a[col.accessorKey] : (a[col.header.toLowerCase()] ?? Object.values(a)[sortCol]);
      let valB = col.accessorKey ? b[col.accessorKey] : (b[col.header.toLowerCase()] ?? Object.values(b)[sortCol]);
      
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";
      
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      
      return sortDir === "asc" 
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortCol, sortDir, columns]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentData = sortedData.slice(startIndex, startIndex + rowsPerPage)

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-1.5 w-[250px]">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input 
              placeholder="Search..." 
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
              className="border-none bg-transparent outline-none text-foreground w-full text-[13px] placeholder:text-muted-foreground" 
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg border border-border ${showFilters ? 'bg-brand-blue text-brand-blue-foreground' : 'bg-transparent text-foreground'} flex justify-center items-center gap-1.5 text-[12px] font-semibold cursor-pointer transition-colors hover:bg-muted`}
          >
            <Filter size={13} /> Filters
          </button>
          
          <select 
            value={rowsPerPage} 
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1.5 rounded-lg border border-border bg-muted text-foreground text-[12px] outline-none cursor-pointer focus:ring-2 focus:ring-brand-blue font-semibold w-[60px]"
          >
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
          </select>
        </div>

        <div className="text-[12px] text-muted-foreground font-semibold">
          {sortedData.length} rows
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            {columns.filter(c => c.header !== "Actions").map((col, i) => (
              <div key={i} className="flex-1 min-w-[140px] flex flex-col">
                <label className="text-[10px] font-bold text-muted-foreground mb-1.5">{col.header}</label>
                <input 
                  placeholder="Filter..." 
                  value={columnFilters[col.header] || ""}
                  onChange={(e) => {
                    setColumnFilters(prev => ({ ...prev, [col.header]: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1.5 rounded-md border border-border bg-muted text-foreground text-[11px] outline-none placeholder:text-muted-foreground" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                {columns.map((col, i) => (
                  <TableHead key={i} className={`font-bold text-muted-foreground h-auto select-none ${dense ? 'text-[11px] py-1.5 px-2' : 'text-[13px] py-2 px-4'}`}>
                    <div 
                      className={`flex items-center gap-1.5 ${col.header !== "Actions" ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
                      onClick={() => {
                        if (col.header === "Actions") return;
                        if (sortCol === i) {
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        } else {
                          setSortCol(i);
                          setSortDir("asc");
                        }
                      }}
                    >
                      {col.header}
                      {col.header !== "Actions" && (
                        <ArrowUpDown 
                          size={12} 
                          className={sortCol === i ? "opacity-100 text-brand-blue" : "opacity-40"} 
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-[13px]">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item, index) => (
                  <TableRow key={keyExtractor(item)} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    {columns.map((col, i) => (
                      <TableCell key={i} className={`font-medium ${dense ? 'py-1.5 px-2 text-[11px]' : 'py-2 px-4 text-[13px]'}`}>
                        {col.cell ? col.cell(item, startIndex + index) : String(item[col.accessorKey as keyof T] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-3 sm:px-4 sm:py-3 border-t border-border bg-transparent flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[12px] text-muted-foreground font-semibold">
            Showing {data.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + rowsPerPage, data.length)} of {data.length} entries
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted border border-border text-muted-foreground hover:bg-brand-blue/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {getVisiblePages().map((page, i) => (
              <button 
                key={i}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] transition-colors border ${
                  currentPage === page 
                    ? 'bg-brand-blue border-brand-blue text-brand-blue-foreground cursor-default' 
                    : page === '...' 
                      ? 'bg-transparent border-transparent text-muted-foreground cursor-default' 
                      : 'bg-transparent border-border text-foreground hover:bg-muted cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted border border-border text-muted-foreground hover:bg-brand-blue/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
