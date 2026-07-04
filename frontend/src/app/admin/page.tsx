'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Settings, FolderKanban, LayoutGrid, Tags, Plus, Trash2, Loader2 
} from "lucide-react";
import { Footer } from "@/components/footer";

interface Item { id: string; name: string; }

export default function AdminPage() {
  const checked = useRequireAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  // --- REAL API QUERIES ---
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<Item[]>('/products')).data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Item[]>('/categories')).data,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get<Item[]>('/tags')).data,
  });

  // --- REAL API MUTATIONS (Categories) ---
  const createCatMutation = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: () => {
      setNewCategory('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  // --- REAL API MUTATIONS (Tags) ---
  const createTagMutation = useMutation({
    mutationFn: (name: string) => api.post('/tags', { name }),
    onSuccess: () => {
      setNewTag('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // --- DYNAMIC STATS (Calculated from API) ---
  const STATS = [
    { label: 'Total Products', value: products?.length.toString() || '0', icon: FolderKanban, color: 'text-[var(--teal)]', bg: 'bg-[var(--teal)]/10' },
    { label: 'Categories', value: categories?.length.toString() || '0', icon: LayoutGrid, color: 'text-[var(--amber)]', bg: 'bg-[var(--amber)]/10' },
    { label: 'Tags', value: tags?.length.toString() || '0', icon: Tags, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  if (!checked) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--paper)]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6 text-[var(--teal)]" />
            <h1 className="font-display text-3xl font-bold text-[var(--ink)] tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-[var(--muted)] font-body">
            Manage system structure, categories, and tags for your assets.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-[var(--line)] bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted)] font-body">{stat.label}</p>
                  <p className="text-2xl font-bold text-[var(--ink)] font-display mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Management Tabs & Lists */}
        <section className="bg-white border border-[var(--line)] rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          
          {/* Custom Tab Header */}
          <div className="flex border-b border-[var(--line)]">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-4 text-sm font-medium font-body flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'categories' 
                  ? 'text-[var(--teal)] border-b-2 border-[var(--teal)] bg-[var(--teal)]/5' 
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> Categories
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex-1 px-6 py-4 text-sm font-medium font-body flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'tags' 
                  ? 'text-[var(--teal)] border-b-2 border-[var(--teal)] bg-[var(--teal)]/5' 
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-gray-50'
              }`}
            >
              <Tags className="h-4 w-4" /> Tags
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            
            {/* --- CATEGORIES TAB --- */}
            {activeTab === 'categories' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newCategory.trim() && createCatMutation.mutate(newCategory)}
                    className="h-10 border-[var(--line)] focus-visible:ring-[var(--teal)]"
                  />
                  <Button 
                    onClick={() => createCatMutation.mutate(newCategory)} 
                    disabled={!newCategory.trim() || createCatMutation.isPending}
                    size="sm"
                    className="h-10 bg-[var(--ink)] hover:bg-[var(--ink])/90 text-[var(--paper)]"
                  >
                    {createCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {categories?.map((cat, i) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-[var(--line)] hover:bg-[var(--paper)] transition-all group animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--teal)]" />
                      <span className="font-medium text-[var(--ink)] text-sm">{cat.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteCatMutation.mutate(cat.id)}
                      disabled={deleteCatMutation.isPending}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {categories?.length === 0 && (
                  <p className="text-sm text-[var(--muted)] text-center py-6">No categories created yet.</p>
                )}
              </div>
            )}

            {/* --- TAGS TAB --- */}
            {activeTab === 'tags' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new tag (e.g., campaign-2024)..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newTag.trim() && createTagMutation.mutate(newTag)}
                    className="h-10 border-[var(--line)] focus-visible:ring-[var(--teal)]"
                  />
                  <Button 
                    onClick={() => createTagMutation.mutate(newTag)} 
                    disabled={!newTag.trim() || createTagMutation.isPending}
                    size="sm"
                    className="h-10 bg-[var(--ink)] hover:bg-[var(--ink])/90 text-[var(--paper)]"
                  >
                    {createTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {tags?.map((tag, i) => (
                    <div 
                      key={tag.id} 
                      className="group flex items-center gap-2 px-4 py-2 bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 rounded-full text-sm font-mono font-medium hover:shadow-sm transition-all animate-in fade-in zoom-in-95"
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                    >
                      <span>#{tag.name}</span>
                      <button 
                        onClick={() => deleteTagMutation.mutate(tag.id)}
                        disabled={deleteTagMutation.isPending}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {tags?.length === 0 && (
                  <p className="text-sm text-[var(--muted)] text-center py-6">No tags created yet.</p>
                )}
              </div>
            )}

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}