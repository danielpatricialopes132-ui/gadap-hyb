'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, UserSession, UserRole, Entity, CatalogItem, FiscalDocument } from '../types/domain';
import { INITIAL_COMPANIES, INITIAL_ENTITIES, INITIAL_CATALOG, INITIAL_DOCUMENTS } from '../mockData';
import { fiscalGateway } from '../services/fiscalEngine';

interface AppContextType {
  // Session & Auth
  session: UserSession | null;
  companies: Company[];
  activeCompany: Company | null;
  login: (accessCode: string, email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchCompany: (companyId: string) => void;
  
  // Base Registrations
  entities: Entity[];
  catalog: CatalogItem[];
  addCompany: (comp: Omit<Company, 'id'>) => void;
  updateCompany: (id: string, comp: Partial<Company>) => void;
  addEntity: (entity: Omit<Entity, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
  updateEntity: (id: string, entity: Partial<Entity>) => void;
  deleteEntity: (id: string) => Promise<void>;
  addCatalogItem: (item: Omit<CatalogItem, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
  updateCatalogItem: (id: string, item: Partial<CatalogItem>) => void;
  deleteCatalogItem: (id: string) => Promise<void>;

  // Fiscal Module
  documents: FiscalDocument[];
  issueNFe: (entityId: string, itemIds: { itemId: string; quantity: number }[]) => Promise<FiscalDocument>;
  issueNFSe: (entityId: string, itemIds: { itemId: string; quantity: number }[]) => Promise<FiscalDocument>;
  cancelFiscalDoc: (docId: string, justification: string) => Promise<boolean>;
  sendCorrectionLetter: (docId: string, correctionText: string) => Promise<boolean>;
  importInboundXml: (xmlData: {
    supplierName: string;
    supplierCnpj: string;
    invoiceNumber: number;
    items: Array<{ description: string; ncm: string; quantity: number; unitPrice: number; cfop: string }>;
  }) => Promise<void>;
  updateFiscalSettings: (settings: Company['fiscalSettings']) => void;
  isSupabaseLive: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [documents, setDocuments] = useState<FiscalDocument[]>(INITIAL_DOCUMENTS);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Initialize with Matriz logged in by default
  const [session, setSession] = useState<UserSession | null>(() => {
    return {
      id: 'usr-01',
      name: 'Diretor Operacional GADAP',
      email: 'admin@gadap.com.br',
      role: 'Admin',
      activeCompanyId: INITIAL_COMPANIES[0].id,
    };
  });

  // Fetch real data from Supabase backend route on mount
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
          if (data.entities) setEntities(data.entities);
          if (data.catalog) setCatalog(data.catalog);
          if (data.documents) setDocuments(data.documents);
          setIsSupabaseLive(true);
        }
      })
      .catch((err) => {
        console.warn('Using local bootstrap, Supabase sync available:', err);
      });
  }, []);

  const activeCompany = companies.find((c) => c.id === session?.activeCompanyId) || companies[0] || null;

  const login = (accessCode: string, email: string, role: UserRole = 'Admin') => {
    const trimmedCode = accessCode.trim().toUpperCase();
    const foundCompany = companies.find(
      (c) => c.accessCode.toUpperCase() === trimmedCode || c.cnpj.replace(/\D/g, '') === trimmedCode.replace(/\D/g, '')
    );

    if (!foundCompany) {
      return false;
    }

    setSession({
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      activeCompanyId: foundCompany.id,
    });

    return true;
  };

  const logout = () => {
    setSession(null);
  };

  const switchCompany = (companyId: string) => {
    if (!session) return;
    const exists = companies.some((c) => c.id === companyId);
    if (exists) {
      setSession({
        ...session,
        activeCompanyId: companyId,
      });
    }
  };

  // Base Registrations CRUD
  const addCompany = (comp: Omit<Company, 'id'>) => {
    const newComp: Company = {
      ...comp,
      id: `comp-${Date.now().toString().slice(-4)}`,
    };
    setCompanies((prev) => [...prev, newComp]);
  };

  const updateCompany = (id: string, updated: Partial<Company>) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const addEntity = async (entityData: Omit<Entity, 'id' | 'companyId' | 'createdAt'>) => {
    if (!session) return;
    const newEnt: Entity = {
      ...entityData,
      id: `ent-${Date.now().toString().slice(-5)}`,
      companyId: session.activeCompanyId,
      createdAt: new Date().toISOString(),
    };
    setEntities((prev) => [newEnt, ...prev]);

    // Async persist to Supabase PostgreSQL
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', table: 'entities', data: newEnt }),
    }).catch(console.error);
  };

  const updateEntity = (id: string, updated: Partial<Entity>) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEntity = async (id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', table: 'entities', id }),
    }).catch(console.error);
  };

  const addCatalogItem = async (itemData: Omit<CatalogItem, 'id' | 'companyId' | 'createdAt'>) => {
    if (!session) return;
    const newItem: CatalogItem = {
      ...itemData,
      id: `cat-${Date.now().toString().slice(-5)}`,
      companyId: session.activeCompanyId,
      createdAt: new Date().toISOString(),
    };
    setCatalog((prev) => [newItem, ...prev]);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', table: 'catalog_items', data: newItem }),
    }).catch(console.error);
  };

  const updateCatalogItem = (id: string, updated: Partial<CatalogItem>) => {
    setCatalog((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
  };

  const deleteCatalogItem = async (id: string) => {
    setCatalog((prev) => prev.filter((item) => item.id !== id));
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', table: 'catalog_items', id }),
    }).catch(console.error);
  };

  // Fiscal Operations
  const updateFiscalSettings = (settings: Company['fiscalSettings']) => {
    if (!activeCompany) return;
    updateCompany(activeCompany.id, { fiscalSettings: settings });
  };

  const issueNFe = async (
    entityId: string,
    itemsToIssue: { itemId: string; quantity: number }[]
  ): Promise<FiscalDocument> => {
    if (!activeCompany) throw new Error('Nenhuma empresa ativa selecionada.');
    const entity = entities.find((e) => e.id === entityId);
    if (!entity) throw new Error('Destinatário não encontrado.');

    const enrichedItems = itemsToIssue.map((i) => {
      const prod = catalog.find((c) => c.id === i.itemId);
      const unitPrice = prod?.unitPrice || 0;
      return {
        code: prod?.code || 'GEN',
        description: prod?.description || 'Item sem descrição',
        ncm: prod?.ncm || '9999.99.99',
        cfop: prod?.cfop || '5102',
        unit: prod?.unit || 'UN',
        quantity: i.quantity,
        unitPrice,
        totalPrice: unitPrice * i.quantity,
        origin: prod?.origin || '0',
      };
    });

    const totalAmount = enrichedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const nextNumber = activeCompany.fiscalSettings.nfeCurrentNumber + 1;
    const currentSeries = activeCompany.fiscalSettings.nfeSeries;

    const isContora =
      activeCompany.fiscalSettings.provider === 'fiscal_contora' ||
      activeCompany.fiscalSettings.provider === 'contora';

    const resp = await fiscalGateway.transmitNFeWithFailover(
      {
        companyId: activeCompany.id,
        companyCnpj: activeCompany.cnpj,
        series: currentSeries,
        number: nextNumber,
        natureOfOperation: 'Venda de mercadoria ou prestação',
        recipient: {
          cpfCnpj: entity.document,
          name: entity.name,
          stateRegistration: entity.stateRegistration,
          email: entity.email,
          address: entity.address,
        },
        items: enrichedItems,
        totalAmount,
        paymentMethod: '01',
      },
      isContora ? 'contora' : 'focus_nfe',
      {
        contoraApiKey: activeCompany.fiscalSettings.fiscalContoraApiKey,
        contoraSecret: activeCompany.fiscalSettings.fiscalContoraSecret,
        focusToken: activeCompany.fiscalSettings.focusNfeToken,
        environment: activeCompany.fiscalSettings.environment,
      }
    );

    // Feature 3: Automatic Stock Decrement on Authorization
    setCatalog((prev) =>
      prev.map((catItem) => {
        const itemDeduction = itemsToIssue.find((i) => i.itemId === catItem.id);
        if (itemDeduction && catItem.type === 'product') {
          const currentStock = catItem.stockBalance ?? 100;
          return {
            ...catItem,
            stockBalance: Math.max(0, currentStock - itemDeduction.quantity),
          };
        }
        return catItem;
      })
    );

    updateCompany(activeCompany.id, {
      fiscalSettings: {
        ...activeCompany.fiscalSettings,
        nfeCurrentNumber: nextNumber,
      },
    });

    const newDoc: FiscalDocument = {
      id: resp.documentId,
      companyId: activeCompany.id,
      type: 'NFe',
      series: currentSeries,
      number: nextNumber,
      status: resp.status,
      entityId: entity.id,
      entityName: entity.name,
      entityDocument: entity.document,
      issueDate: new Date().toISOString(),
      totalAmount,
      protocol: resp.protocol,
      accessKey: resp.accessKey,
      authorizationDate: resp.success ? new Date().toISOString() : undefined,
      rejectionReason: resp.rejectionReason,
      providerUsed: resp.providerUsed,
      xmlUrl: resp.xmlUrl,
      pdfDanfeUrl: resp.pdfUrl,
      items: enrichedItems.map((item, idx) => ({
        itemId: itemsToIssue[idx]?.itemId || `item-${idx}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
        cfop: item.cfop,
        ncm: item.ncm,
      })),
    };

    setDocuments((prev) => [newDoc, ...prev]);

    // Persist to Supabase
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', table: 'fiscal_documents', data: newDoc }),
    }).catch(console.error);

    return newDoc;
  };

  const issueNFSe = async (
    entityId: string,
    itemsToIssue: { itemId: string; quantity: number }[]
  ): Promise<FiscalDocument> => {
    if (!activeCompany) throw new Error('Nenhuma empresa ativa selecionada.');
    const entity = entities.find((e) => e.id === entityId);
    if (!entity) throw new Error('Tomador de serviço não encontrado.');

    const serviceItem = catalog.find((c) => c.id === itemsToIssue[0]?.itemId);
    const quantity = itemsToIssue[0]?.quantity || 1;
    const unitPrice = serviceItem?.unitPrice || 0;
    const totalAmount = unitPrice * quantity;

    const nextNumber = activeCompany.fiscalSettings.nfseCurrentNumber + 1;
    const currentSeries = activeCompany.fiscalSettings.nfseSeries;

    const isContora =
      activeCompany.fiscalSettings.provider === 'fiscal_contora' ||
      activeCompany.fiscalSettings.provider === 'contora';

    const provider = fiscalGateway.getProvider(isContora ? 'contora' : 'focus_nfe');
    const credentials = isContora
      ? {
          apiKey: activeCompany.fiscalSettings.fiscalContoraApiKey,
          secret: activeCompany.fiscalSettings.fiscalContoraSecret,
          environment: activeCompany.fiscalSettings.environment,
        }
      : {
          token: activeCompany.fiscalSettings.focusNfeToken,
          environment: activeCompany.fiscalSettings.environment,
        };

    const resp = await provider.transmitNFSe(
      {
        companyId: activeCompany.id,
        companyCnpj: activeCompany.cnpj,
        series: currentSeries,
        number: nextNumber,
        serviceDescription: serviceItem?.description || 'Prestação de Serviços Especializados GADAP',
        lc116Item: serviceItem?.lc116Item || '01.07',
        issRate: serviceItem?.issRate || 2.0,
        totalServiceAmount: totalAmount,
        recipient: {
          cpfCnpj: entity.document,
          name: entity.name,
          email: entity.email,
          address: {
            city: entity.address.city,
            state: entity.address.state,
          },
        },
      },
      credentials
    );

    updateCompany(activeCompany.id, {
      fiscalSettings: {
        ...activeCompany.fiscalSettings,
        nfseCurrentNumber: nextNumber,
      },
    });

    const newDoc: FiscalDocument = {
      id: resp.documentId,
      companyId: activeCompany.id,
      type: 'NFSe',
      series: currentSeries,
      number: nextNumber,
      status: resp.status,
      entityId: entity.id,
      entityName: entity.name,
      entityDocument: entity.document,
      issueDate: new Date().toISOString(),
      totalAmount,
      protocol: resp.protocol,
      authorizationDate: new Date().toISOString(),
      pdfDanfeUrl: resp.pdfUrl,
      items: [
        {
          itemId: serviceItem?.id || 'gen',
          description: serviceItem?.description || 'Serviço prestado',
          quantity,
          unitPrice,
          total: totalAmount,
        },
      ],
    };

    setDocuments((prev) => [newDoc, ...prev]);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', table: 'fiscal_documents', data: newDoc }),
    }).catch(console.error);

    return newDoc;
  };

  const cancelFiscalDoc = async (docId: string, justification: string): Promise<boolean> => {
    const provider = fiscalGateway.getProvider(activeCompany?.fiscalSettings.provider || 'focus_nfe');
    await provider.cancelDocument(docId, justification);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status: 'Canceled' as const } : doc))
    );

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', table: 'fiscal_documents', id: docId, data: { justification } }),
    }).catch(console.error);

    return true;
  };

  // Feature 1: Carta de Correção Eletrônica (CC-e)
  const sendCorrectionLetter = async (docId: string, correctionText: string): Promise<boolean> => {
    if (correctionText.trim().length < 15) {
      throw new Error('A justificativa da CC-e deve conter no mínimo 15 caracteres.');
    }

    const doc = documents.find((d) => d.id === docId);
    if (!doc) throw new Error('Documento fiscal não encontrado.');

    const newSequence = (doc.correctionLetters?.length || 0) + 1;
    const newLetter = {
      sequence: newSequence,
      correctionText: correctionText.trim(),
      registeredAt: new Date().toISOString(),
      protocol: `1352600${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              correctionLetters: [...(d.correctionLetters || []), newLetter],
            }
          : d
      )
    );

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cce',
        table: 'fiscal_documents',
        id: docId,
        data: newLetter,
      }),
    }).catch(console.error);

    return true;
  };

  // Feature 1 & 3: Importação de XML de Compras com Lançamento em Estoque
  const importInboundXml = async (xmlData: {
    supplierName: string;
    supplierCnpj: string;
    invoiceNumber: number;
    items: Array<{ description: string; ncm: string; quantity: number; unitPrice: number; cfop: string }>;
  }) => {
    if (!activeCompany) return;

    // 1. Cadastra fornecedor se não existir
    const existingSupplier = entities.find(
      (e) => e.document.replace(/\D/g, '') === xmlData.supplierCnpj.replace(/\D/g, '')
    );

    if (!existingSupplier) {
      await addEntity({
        type: 'PJ',
        role: 'fornecedor',
        name: xmlData.supplierName,
        tradeName: xmlData.supplierName,
        document: xmlData.supplierCnpj,
        email: 'financeiro@fornecedor.com.br',
        phone: '(11) 3210-4400',
        address: {
          zipCode: '01001-000',
          street: 'Av. Industrial Fornecedor',
          number: '500',
          district: 'Distrito Industrial',
          city: 'São Paulo',
          state: 'SP',
        },
      });
    }

    // 2. Lança ou atualiza estoque dos itens
    for (const it of xmlData.items) {
      const existingProduct = catalog.find(
        (c) => c.description.toLowerCase().trim() === it.description.toLowerCase().trim()
      );

      if (existingProduct) {
        setCatalog((prev) =>
          prev.map((c) =>
            c.id === existingProduct.id
              ? {
                  ...c,
                  stockBalance: (c.stockBalance ?? 0) + it.quantity,
                  costPrice: it.unitPrice,
                }
              : c
          )
        );
      } else {
        await addCatalogItem({
          type: 'product',
          code: `IMP-${Math.floor(1000 + Math.random() * 9000)}`,
          description: it.description,
          unit: 'UN',
          unitPrice: Number((it.unitPrice * 1.45).toFixed(2)), // Margem sugerida
          costPrice: it.unitPrice,
          stockBalance: it.quantity,
          minStock: 10,
          ncm: it.ncm,
          cfop: '1102',
          origin: '0',
          status: 'active',
        });
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        session,
        companies,
        activeCompany,
        login,
        logout,
        switchCompany,
        entities: entities.filter((e) => e.companyId === session?.activeCompanyId),
        catalog: catalog.filter((c) => c.companyId === session?.activeCompanyId),
        addCompany,
        updateCompany,
        addEntity,
        updateEntity,
        deleteEntity,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        documents: documents.filter((d) => d.companyId === session?.activeCompanyId),
        issueNFe,
        issueNFSe,
        cancelFiscalDoc,
        sendCorrectionLetter,
        importInboundXml,
        updateFiscalSettings,
        isSupabaseLive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
