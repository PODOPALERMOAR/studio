'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Shield,
  Activity,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Panel Avanzado',
    href: '/admin/advanced',
    icon: Activity,
    current: false,
  },
  {
    name: 'Pacientes',
    href: '/admin/patients',
    icon: Users,
    current: false,
  },
  {
    name: 'Configuración',
    icon: Settings,
    current: false,
    children: [
      { name: 'Perfil', href: '/admin/settings/profile', icon: Users },
      { name: 'Seguridad', href: '/admin/settings/security', icon: Shield },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-blue-600">PODOPALERMO</h1>
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {!item.children ? (
                        <Link
                          href={item.href!}
                          className={cn(
                            pathname === item.href
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <item.icon
                            className={cn(
                              pathname === item.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ) : (
                        <div>
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className={cn(
                              'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                              'group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm leading-6 font-semibold'
                            )}
                          >
                            <item.icon
                              className="text-gray-400 group-hover:text-blue-700 h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            {item.name}
                            {expandedItems.includes(item.name) ? (
                              <ChevronDown className="ml-auto h-4 w-4" />
                            ) : (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </button>
                          {expandedItems.includes(item.name) && (
                            <ul className="mt-1 px-2">
                              {item.children.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      pathname === subItem.href
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50',
                                      'group flex gap-x-3 rounded-md py-2 pl-9 pr-2 text-sm leading-6'
                                    )}
                                  >
                                    <subItem.icon
                                      className={cn(
                                        pathname === subItem.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                                        'h-4 w-4 shrink-0'
                                      )}
                                      aria-hidden="true"
                                    />
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "relative z-50 lg:hidden",
        isOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                <span className="sr-only">Cerrar sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-blue-600">PODOPALERMO</h1>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          {!item.children ? (
                            <Link
                              href={item.href!}
                              onClick={onClose}
                              className={cn(
                                pathname === item.href
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  pathname === item.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                                  'h-6 w-6 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          ) : (
                            <div>
                              <button
                                onClick={() => toggleExpanded(item.name)}
                                className={cn(
                                  'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                                  'group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm leading-6 font-semibold'
                                )}
                              >
                                <item.icon
                                  className="text-gray-400 group-hover:text-blue-700 h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                                {expandedItems.includes(item.name) ? (
                                  <ChevronDown className="ml-auto h-4 w-4" />
                                ) : (
                                  <ChevronRight className="ml-auto h-4 w-4" />
                                )}
                              </button>
                              {expandedItems.includes(item.name) && (
                                <ul className="mt-1 px-2">
                                  {item.children.map((subItem) => (
                                    <li key={subItem.name}>
                                      <Link
                                        href={subItem.href}
                                        onClick={onClose}
                                        className={cn(
                                          pathname === subItem.href
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50',
                                          'group flex gap-x-3 rounded-md py-2 pl-9 pr-2 text-sm leading-6'
                                        )}
                                      >
                                        <subItem.icon
                                          className={cn(
                                            pathname === subItem.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                                            'h-4 w-4 shrink-0'
                                          )}
                                          aria-hidden="true"
                                        />
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}