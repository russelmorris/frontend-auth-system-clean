'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteReference: string;
  notes?: string;
  specialConditions?: string[];
}

const SPECIAL_KEYWORDS = [
  'dangerous goods',
  'hazardous',
  'refrigerated',
  'temperature controlled',
  'fragile',
  'oversized',
  'overweight',
  'special handling',
  'customs inspection',
  'quarantine',
  'time sensitive',
  'perishable',
  'high value',
  'insurance required',
  'escort required',
  'special equipment',
];

export function NotesModal({
  isOpen,
  onClose,
  quoteReference,
  notes = '',
  specialConditions = []
}: NotesModalProps) {
  // Parse notes to find special conditions
  const highlightSpecialConditions = (text: string) => {
    if (!text) return { __html: 'No notes available for this quote.' };
    
    let highlightedText = text;
    
    // Highlight special keywords
    SPECIAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">$1</mark>'
      );
    });
    
    // Convert line breaks to <br>
    highlightedText = highlightedText.replace(/\n/g, '<br />');
    
    return { __html: highlightedText };
  };

  const hasSpecialConditions = SPECIAL_KEYWORDS.some(keyword => 
    notes.toLowerCase().includes(keyword.toLowerCase())
  ) || specialConditions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Notes - {quoteReference}
          </DialogTitle>
          <DialogDescription>
            Terms, conditions, and special requirements for this quote
          </DialogDescription>
        </DialogHeader>
        
        {hasSpecialConditions && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              This quote contains special conditions or requirements
            </span>
          </div>
        )}

        {specialConditions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              Special Conditions:
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialConditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Notes & Terms:</h3>
              <div 
                className="text-sm text-muted-foreground whitespace-pre-wrap"
                dangerouslySetInnerHTML={highlightSpecialConditions(notes)}
              />
            </div>
            
            {!notes && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notes available for this quote</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}