import { useState, useRef, useEffect } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { getLanguage, getLanguages } from '../config/languages';
import { ChevronDown, Search, X } from 'lucide-react';

export default function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage, dictationStatus } = useDictationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentLang = getLanguage(selectedLanguage);
  const languages = getLanguages();

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search.toLowerCase()) ||
      lang.code.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    if (dictationStatus === 'listening') {
      // Warn if trying to change language while listening
      if (!confirm('Changing language will stop current dictation. Continue?')) {
        return;
      }
    }
    setSelectedLanguage(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected language button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent transition-colors min-w-[180px]"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{currentLang?.flag}</span>
        <span className="flex-1 text-left text-sm font-medium truncate">{currentLang?.name}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-[300px] rounded-xl border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
          {/* Search */}
          <div className="relative border-b border-border p-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md bg-transparent pl-9 pr-8 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Language list */}
          <div className="max-h-[300px] overflow-y-auto py-2">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors ${
                    lang.code === selectedLanguage ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {lang.code === selectedLanguage && (
                    <span className="ml-auto text-xs text-primary font-medium">Selected</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No languages found matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
