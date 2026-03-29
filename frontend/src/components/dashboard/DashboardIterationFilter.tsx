import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sortIterationIds } from '@/lib/sortIterationIds';

type Props = {
  iterationIds: string[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
};

/**
 * Include/exclude iterations: checkboxes + range shortcut.
 */
export function DashboardIterationFilter({
  iterationIds,
  selectedIds,
  onSelectedIdsChange,
}: Props) {
  const sortedIds = useMemo(() => sortIterationIds(iterationIds), [iterationIds]);

  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');

  useEffect(() => {
    if (sortedIds.length > 0) {
      setRangeFrom((f) => (f && sortedIds.includes(f) ? f : sortedIds[0]!));
      setRangeTo((t) => (t && sortedIds.includes(t) ? t : sortedIds[sortedIds.length - 1]!));
    }
  }, [sortedIds]);

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      onSelectedIdsChange(next);
    },
    [selectedIds, onSelectedIdsChange],
  );

  const selectAll = useCallback(() => {
    onSelectedIdsChange(new Set(sortedIds));
  }, [sortedIds, onSelectedIdsChange]);

  const clearAll = useCallback(() => {
    onSelectedIdsChange(new Set());
  }, [onSelectedIdsChange]);

  const applyRange = useCallback(() => {
    if (!rangeFrom || !rangeTo || sortedIds.length === 0) return;
    const i0 = sortedIds.indexOf(rangeFrom);
    const i1 = sortedIds.indexOf(rangeTo);
    if (i0 < 0 || i1 < 0) return;
    const lo = Math.min(i0, i1);
    const hi = Math.max(i0, i1);
    const next = new Set<string>();
    for (let i = lo; i <= hi; i++) next.add(sortedIds[i]!);
    onSelectedIdsChange(next);
  }, [rangeFrom, rangeTo, sortedIds, onSelectedIdsChange]);

  const selectedCount = selectedIds.size;
  const total = sortedIds.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Iterations to show</CardTitle>
        <CardDescription>
          Uncheck runs to hide them from summary cards and charts. Use the range shortcut to select a
          contiguous block (sorted by iteration id).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedCount} of {total} selected
          </span>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={selectAll}>
            Select all
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={clearAll}>
            Clear all
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <p className="w-full text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Quick range (inclusive)
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="range-from">
                From
              </label>
              <Select value={rangeFrom} onValueChange={(v: string | null) => v && setRangeFrom(v)}>
                <SelectTrigger id="range-from" className="h-8 w-[min(100%,11rem)]">
                  <SelectValue placeholder="First" />
                </SelectTrigger>
                <SelectContent>
                  {sortedIds.map((id: string) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="range-to">
                To
              </label>
              <Select value={rangeTo} onValueChange={(v: string | null) => v && setRangeTo(v)}>
                <SelectTrigger id="range-to" className="h-8 w-[min(100%,11rem)]">
                  <SelectValue placeholder="Last" />
                </SelectTrigger>
                <SelectContent>
                  {sortedIds.map((id: string) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" size="sm" className="h-8" onClick={applyRange}>
              Apply range
            </Button>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3"
          role="group"
          aria-label="Include iterations"
        >
          {sortedIds.map((id: string) => (
            <div key={id} className="flex items-center gap-2">
              <Checkbox
                id={`iter-${id}`}
                checked={selectedIds.has(id)}
                onCheckedChange={(c) => toggle(id, c === true)}
              />
              <label htmlFor={`iter-${id}`} className="cursor-pointer text-sm font-normal">
                {id}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
