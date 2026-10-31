'use client';

import * as React from 'react';

import { FieldValues, PathValue, Path, UseFormReturn } from 'react-hook-form';
import { Icons } from '@/components/ui/icons';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/util/tw-merge';
import type { List } from '@/types';

interface ListPickerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  register: Path<T>;
  lists: List[];
}

export function ListPicker<T extends FieldValues>({
  form,
  register,
  lists,
}: ListPickerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const selectedListId = form.watch(register) as string | null | undefined;
  const selectedList = lists.find((list) => list.id === selectedListId);

  const onSelect = (list?: List) => {
    setOpen(false);

    // Always write the field so "Inbox" (null) can clear an existing list.
    form.setValue(register, (list?.id ?? null) as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-between"
        >
          {selectedList?.name || 'Inbox'}
          <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandGroup>
            <CommandItem value="inbox" onSelect={() => onSelect()}>
              <Icons.Check
                className={cn(
                  'mr-2 h-4 w-4',
                  !selectedList ? 'opacity-100' : 'opacity-0',
                )}
              />
              Inbox
            </CommandItem>
            {lists.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => onSelect(item)}
              >
                <Icons.Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedListId === item.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
