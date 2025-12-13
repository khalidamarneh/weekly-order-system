--
-- PostgreSQL database dump
--

\restrict 6uTLzPFa6oaEdWuNca6bYwprKXedhaVbRpyiBOopErF9FeJE5ZKveswlWPH149a

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS "quotations_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS "quotations_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.quotation_order_conversions DROP CONSTRAINT IF EXISTS "quotation_order_conversions_quotationId_fkey";
ALTER TABLE IF EXISTS ONLY public.quotation_order_conversions DROP CONSTRAINT IF EXISTS "quotation_order_conversions_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS "quotation_items_quotationId_fkey";
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS "quotation_items_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_orders DROP CONSTRAINT IF EXISTS "outbound_orders_supplierId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_orders DROP CONSTRAINT IF EXISTS "outbound_orders_clientId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_order_items DROP CONSTRAINT IF EXISTS "outbound_order_items_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_order_items DROP CONSTRAINT IF EXISTS "outbound_order_items_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoices DROP CONSTRAINT IF EXISTS "outbound_invoices_inboundInvoiceId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoices DROP CONSTRAINT IF EXISTS "outbound_invoices_customerId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoices DROP CONSTRAINT IF EXISTS "outbound_invoices_clientId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoice_items DROP CONSTRAINT IF EXISTS "outbound_invoice_items_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoice_items DROP CONSTRAINT IF EXISTS "outbound_invoice_items_invoiceId_fkey";
ALTER TABLE IF EXISTS ONLY public.outbound_invoice_items DROP CONSTRAINT IF EXISTS "outbound_invoice_items_inboundItemId_fkey";
ALTER TABLE IF EXISTS ONLY public.order_controls DROP CONSTRAINT IF EXISTS "order_controls_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_orders DROP CONSTRAINT IF EXISTS "inbound_orders_outboundOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_orders DROP CONSTRAINT IF EXISTS "inbound_orders_clientId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_order_items DROP CONSTRAINT IF EXISTS "inbound_order_items_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_order_items DROP CONSTRAINT IF EXISTS "inbound_order_items_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_invoices DROP CONSTRAINT IF EXISTS "inbound_invoices_supplierId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_invoices DROP CONSTRAINT IF EXISTS "inbound_invoices_outboundOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_invoice_items DROP CONSTRAINT IF EXISTS "inbound_invoice_items_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.inbound_invoice_items DROP CONSTRAINT IF EXISTS "inbound_invoice_items_invoiceId_fkey";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "categories_parentId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."quotations_quotationId_key";
DROP INDEX IF EXISTS public.public_users_email_key;
DROP INDEX IF EXISTS public."products_partNo_key";
DROP INDEX IF EXISTS public."outbound_orders_orderNumber_key";
DROP INDEX IF EXISTS public."outbound_invoices_invoiceNumber_key";
DROP INDEX IF EXISTS public."order_controls_userId_key";
DROP INDEX IF EXISTS public."inbound_orders_orderNumber_key";
DROP INDEX IF EXISTS public."inbound_invoices_invoiceNumber_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation_order_conversions DROP CONSTRAINT IF EXISTS quotation_order_conversions_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS quotation_items_pkey;
ALTER TABLE IF EXISTS ONLY public.public_users DROP CONSTRAINT IF EXISTS public_users_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.outbound_orders DROP CONSTRAINT IF EXISTS outbound_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.outbound_order_items DROP CONSTRAINT IF EXISTS outbound_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.outbound_invoices DROP CONSTRAINT IF EXISTS outbound_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.outbound_invoice_items DROP CONSTRAINT IF EXISTS outbound_invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.order_controls DROP CONSTRAINT IF EXISTS order_controls_pkey;
ALTER TABLE IF EXISTS ONLY public.inbound_orders DROP CONSTRAINT IF EXISTS inbound_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.inbound_order_items DROP CONSTRAINT IF EXISTS inbound_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.inbound_invoices DROP CONSTRAINT IF EXISTS inbound_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.inbound_invoice_items DROP CONSTRAINT IF EXISTS inbound_invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.suppliers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation_order_conversions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.public_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.outbound_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.outbound_order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.outbound_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.outbound_invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_controls ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inbound_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inbound_order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inbound_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inbound_invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.suppliers_id_seq;
DROP TABLE IF EXISTS public.suppliers;
DROP SEQUENCE IF EXISTS public.quotations_id_seq;
DROP TABLE IF EXISTS public.quotations;
DROP SEQUENCE IF EXISTS public.quotation_order_conversions_id_seq;
DROP TABLE IF EXISTS public.quotation_order_conversions;
DROP SEQUENCE IF EXISTS public.quotation_items_id_seq;
DROP TABLE IF EXISTS public.quotation_items;
DROP SEQUENCE IF EXISTS public.public_users_id_seq;
DROP TABLE IF EXISTS public.public_users;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.outbound_orders_id_seq;
DROP TABLE IF EXISTS public.outbound_orders;
DROP SEQUENCE IF EXISTS public.outbound_order_items_id_seq;
DROP TABLE IF EXISTS public.outbound_order_items;
DROP SEQUENCE IF EXISTS public.outbound_invoices_id_seq;
DROP TABLE IF EXISTS public.outbound_invoices;
DROP SEQUENCE IF EXISTS public.outbound_invoice_items_id_seq;
DROP TABLE IF EXISTS public.outbound_invoice_items;
DROP SEQUENCE IF EXISTS public.order_controls_id_seq;
DROP TABLE IF EXISTS public.order_controls;
DROP SEQUENCE IF EXISTS public.inbound_orders_id_seq;
DROP TABLE IF EXISTS public.inbound_orders;
DROP SEQUENCE IF EXISTS public.inbound_order_items_id_seq;
DROP TABLE IF EXISTS public.inbound_order_items;
DROP SEQUENCE IF EXISTS public.inbound_invoices_id_seq;
DROP TABLE IF EXISTS public.inbound_invoices;
DROP SEQUENCE IF EXISTS public.inbound_invoice_items_id_seq;
DROP TABLE IF EXISTS public.inbound_invoice_items;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."ShipmentStatus";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."QuotationStatus";
DROP TYPE IF EXISTS public."PaymentStatus";
DROP TYPE IF EXISTS public."PaymentMethod";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."InvoiceStatus";
DROP TYPE IF EXISTS public."InternalStatus";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: InternalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InternalStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'CHECK',
    'DIGITAL_WALLET',
    'OTHER'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: QuotationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuotationStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'CLIENT'
);


--
-- Name: ShipmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShipmentStatus" AS ENUM (
    'PENDING',
    'PACKED',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'RETURNED',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    "parentId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    gps text,
    company text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "creditLimit" double precision DEFAULT 0,
    "paymentTerms" text,
    "taxId" text
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: inbound_invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbound_invoice_items (
    id integer NOT NULL,
    "invoiceId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: inbound_invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inbound_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inbound_invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inbound_invoice_items_id_seq OWNED BY public.inbound_invoice_items.id;


--
-- Name: inbound_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbound_invoices (
    id integer NOT NULL,
    "supplierId" integer NOT NULL,
    "outboundOrderId" integer,
    "invoiceNumber" text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'DRAFT'::public."InvoiceStatus" NOT NULL,
    amount double precision NOT NULL,
    tax double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "balanceDue" double precision DEFAULT 0 NOT NULL,
    "csvFileName" text,
    "dueDate" timestamp(3) without time zone,
    "importDate" timestamp(3) without time zone,
    "importedFromCsv" boolean DEFAULT false NOT NULL,
    "issueDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paymentMethod" public."PaymentMethod",
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL
);


--
-- Name: inbound_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inbound_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inbound_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inbound_invoices_id_seq OWNED BY public.inbound_invoices.id;


--
-- Name: inbound_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbound_order_items (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "imagePath" text,
    "isUnlisted" boolean DEFAULT false NOT NULL
);


--
-- Name: inbound_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inbound_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inbound_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inbound_order_items_id_seq OWNED BY public.inbound_order_items.id;


--
-- Name: inbound_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbound_orders (
    id integer NOT NULL,
    "clientId" integer NOT NULL,
    "orderNumber" text NOT NULL,
    status public."OrderStatus" DEFAULT 'DRAFT'::public."OrderStatus" NOT NULL,
    "weekStartDate" timestamp(3) without time zone NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    "outboundOrderId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "internalStatus" public."InternalStatus" DEFAULT 'PENDING'::public."InternalStatus" NOT NULL
);


--
-- Name: inbound_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inbound_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inbound_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inbound_orders_id_seq OWNED BY public.inbound_orders.id;


--
-- Name: order_controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_controls (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "showSalePrice" boolean DEFAULT false NOT NULL,
    "showQuantity" boolean DEFAULT false NOT NULL,
    "timeControlEnabled" boolean DEFAULT false NOT NULL,
    "timeControlType" text,
    "timeControlSettings" jsonb,
    "warningEnabled" boolean DEFAULT false NOT NULL,
    "customMessage" text,
    "customMessageActive" boolean DEFAULT false NOT NULL,
    "customMessageExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "periodStartTime" timestamp(3) without time zone,
    "imagePath" text,
    "isUnlisted" boolean DEFAULT false NOT NULL
);


--
-- Name: order_controls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_controls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_controls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_controls_id_seq OWNED BY public.order_controls.id;


--
-- Name: outbound_invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbound_invoice_items (
    id integer NOT NULL,
    "invoiceId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "inboundItemId" integer,
    "markupAmount" double precision,
    "markupPercentage" double precision,
    "unitCost" double precision
);


--
-- Name: outbound_invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outbound_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outbound_invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outbound_invoice_items_id_seq OWNED BY public.outbound_invoice_items.id;


--
-- Name: outbound_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbound_invoices (
    id integer NOT NULL,
    "clientId" integer,
    "inboundInvoiceId" integer,
    "invoiceNumber" text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'DRAFT'::public."InvoiceStatus" NOT NULL,
    "totalAmount" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "balanceDue" double precision DEFAULT 0 NOT NULL,
    "baseCost" double precision,
    "customerId" integer,
    discount double precision DEFAULT 0 NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "issueDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "markupAmount" double precision,
    "markupPercentage" double precision,
    notes text,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paymentMethod" public."PaymentMethod",
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "shipmentStatus" public."ShipmentStatus" DEFAULT 'PENDING'::public."ShipmentStatus" NOT NULL,
    "shippingAddress" text,
    subtotal double precision NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "taxRate" double precision DEFAULT 0 NOT NULL,
    terms text,
    "trackingNumber" text,
    "viewedAt" timestamp(3) without time zone
);


--
-- Name: outbound_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outbound_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outbound_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outbound_invoices_id_seq OWNED BY public.outbound_invoices.id;


--
-- Name: outbound_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbound_order_items (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: outbound_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outbound_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outbound_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outbound_order_items_id_seq OWNED BY public.outbound_order_items.id;


--
-- Name: outbound_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbound_orders (
    id integer NOT NULL,
    "supplierId" integer NOT NULL,
    "clientId" integer,
    "orderNumber" text NOT NULL,
    status public."OrderStatus" DEFAULT 'DRAFT'::public."OrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: outbound_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outbound_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outbound_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outbound_orders_id_seq OWNED BY public.outbound_orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    "partNo" text,
    "costPrice" double precision,
    "markupPercentage" double precision DEFAULT 0,
    "salePrice" double precision DEFAULT 0,
    "categoryId" integer NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "minStockLevel" integer DEFAULT 10,
    quantity integer DEFAULT 0
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: public_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: public_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.public_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: public_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.public_users_id_seq OWNED BY public.public_users.id;


--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_items (
    id integer NOT NULL,
    "quotationId" integer NOT NULL,
    "productId" integer,
    name text NOT NULL,
    "partNo" text,
    description text,
    image text,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_items_id_seq OWNED BY public.quotation_items.id;


--
-- Name: quotation_order_conversions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_order_conversions (
    id integer NOT NULL,
    "quotationId" integer NOT NULL,
    "orderId" integer NOT NULL,
    "orderNumber" text NOT NULL,
    "convertedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: quotation_order_conversions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_order_conversions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_order_conversions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_order_conversions_id_seq OWNED BY public.quotation_order_conversions.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    "quotationId" text NOT NULL,
    "customerName" text,
    "customerEmail" text,
    "customerPhone" text,
    "offerDate" timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    notes text,
    subtotal double precision NOT NULL,
    "taxRate" double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    status public."QuotationStatus" DEFAULT 'DRAFT'::public."QuotationStatus" NOT NULL,
    "createdById" integer NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "viewedAt" timestamp(3) without time zone,
    "acceptedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customerId" integer
);


--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    contact text,
    email text,
    phone text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    company text DEFAULT 'Al-Waleed Inc Client'::text NOT NULL,
    role public."Role" DEFAULT 'CLIENT'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    address text,
    gps text,
    tel text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: inbound_invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.inbound_invoice_items_id_seq'::regclass);


--
-- Name: inbound_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoices ALTER COLUMN id SET DEFAULT nextval('public.inbound_invoices_id_seq'::regclass);


--
-- Name: inbound_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_order_items ALTER COLUMN id SET DEFAULT nextval('public.inbound_order_items_id_seq'::regclass);


--
-- Name: inbound_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_orders ALTER COLUMN id SET DEFAULT nextval('public.inbound_orders_id_seq'::regclass);


--
-- Name: order_controls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_controls ALTER COLUMN id SET DEFAULT nextval('public.order_controls_id_seq'::regclass);


--
-- Name: outbound_invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.outbound_invoice_items_id_seq'::regclass);


--
-- Name: outbound_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoices ALTER COLUMN id SET DEFAULT nextval('public.outbound_invoices_id_seq'::regclass);


--
-- Name: outbound_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_order_items ALTER COLUMN id SET DEFAULT nextval('public.outbound_order_items_id_seq'::regclass);


--
-- Name: outbound_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_orders ALTER COLUMN id SET DEFAULT nextval('public.outbound_orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: public_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_users ALTER COLUMN id SET DEFAULT nextval('public.public_users_id_seq'::regclass);


--
-- Name: quotation_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items ALTER COLUMN id SET DEFAULT nextval('public.quotation_items_id_seq'::regclass);


--
-- Name: quotation_order_conversions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_order_conversions ALTER COLUMN id SET DEFAULT nextval('public.quotation_order_conversions_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a88c6ade-1985-46e3-8735-812329628ad1	89222d946c42e1553cbcfb38eaac047cfe930389361ebc629ec4d1179d07ba2d	2025-08-22 20:21:47.34597-04	20250819223807_weeklyorder	\N	\N	2025-08-22 20:21:47.325545-04	1
59ec44d8-a609-485f-b8dc-aaa3ac06acb7	e86984021ab2040059768941612addb0336a6a876acaa3ed9d93c8356776b040	2025-08-22 20:21:47.347706-04	20250821150033_make_product_fields_optional	\N	\N	2025-08-22 20:21:47.34633-04	1
9f6bbbc5-f48e-4d6d-ad00-91ab96c81ce7	b4d1cc36ee2dfec16618665eed5422f4cc179f107a46b195a1fdb78615cdf46d	2025-08-22 20:21:47.354843-04	20250822004654_add_user_details_and_user_role	\N	\N	2025-08-22 20:21:47.348038-04	1
3cd5a4f2-3aa2-4574-a69a-4b613096921e	4bc1968f808dcb9aff8faf7cc2c84b82267da524bf83ae85d959f05f63acd62a	2025-08-22 20:21:47.361386-04	20250822235948_oldworking	\N	\N	2025-08-22 20:21:47.355193-04	1
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, "parentId", "createdAt", "updatedAt") FROM stdin;
8	test 6	\N	2025-08-26 15:58:05.704	2025-08-26 15:58:05.704
9	 test 7	\N	2025-08-26 16:17:04.337	2025-08-26 16:17:04.337
11	Test 10 	\N	2025-08-27 12:52:16.619	2025-08-27 12:52:16.619
67	davidov	\N	2025-10-01 08:52:18.339	2025-10-01 08:52:18.339
13	Final Test Uploads	\N	2025-08-27 22:48:57.033	2025-08-27 22:48:57.033
3	winston great	\N	2025-08-24 21:31:44.645	2025-10-01 12:33:37.458
15	ss	\N	2025-08-31 22:47:48.424	2025-08-31 22:47:48.424
70	FOOL	\N	2025-10-04 19:14:18.7	2025-10-04 19:14:18.7
71	FOOL 2	\N	2025-10-06 12:46:43.753	2025-10-06 12:46:43.753
72	Invoice Test	\N	2025-10-31 00:57:25.809	2025-10-31 00:57:25.809
68	NOT GOOD	\N	2025-10-01 15:59:18.482	2025-11-08 20:02:13.713
74	Debug	\N	2025-11-08 20:11:38.517	2025-11-08 20:11:38.517
2	Snuf	\N	2025-08-23 00:58:16.669	2025-11-08 20:52:41.43
7	TEST 1	\N	2025-08-26 15:49:32.18	2025-11-09 01:16:08.665
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, phone, address, gps, company, "createdAt", "updatedAt", "creditLimit", "paymentTerms", "taxId") FROM stdin;
1	nafez	nafez@gmail.com	+1456456456456	jobeiha		ahlan	2025-10-06 11:40:01.614	2025-10-06 11:40:01.614	0	\N	\N
2	Moh	moh@gmail.com	+321321	USA NC		LOL	2025-10-08 13:38:48.585	2025-10-08 13:38:48.585	0	\N	\N
3	Jameel	jameel@yahoo.com	+123123123	CA		AlMaaber	2025-10-08 15:58:38.33	2025-10-08 15:59:25.407	0	\N	\N
4	SALAM	ahx@gmail.com	+123123654654	NC,Charlotte		AHX	2025-10-08 21:41:57.641	2025-10-08 21:41:57.641	0	\N	\N
\.


--
-- Data for Name: inbound_invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inbound_invoice_items (id, "invoiceId", "productId", quantity, "unitPrice", "totalPrice", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inbound_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inbound_invoices (id, "supplierId", "outboundOrderId", "invoiceNumber", status, amount, tax, "totalAmount", "createdAt", "updatedAt", "balanceDue", "csvFileName", "dueDate", "importDate", "importedFromCsv", "issueDate", notes, "paidAmount", "paymentMethod", "paymentStatus") FROM stdin;
\.


--
-- Data for Name: inbound_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inbound_order_items (id, "orderId", "productId", quantity, "createdAt", "updatedAt", description, "imagePath", "isUnlisted") FROM stdin;
59	14	\N	3	2025-09-17 21:24:27.223	2025-09-17 21:24:41.194	\N	\N	f
63	15	\N	4	2025-09-18 10:33:10.009	2025-09-18 10:33:10.009	\N	\N	f
79	19	\N	4	2025-09-21 00:40:36.316	2025-09-21 00:40:36.316	\N	\N	f
64	15	110	4	2025-09-18 10:33:12.931	2025-09-18 10:33:12.931	\N	\N	f
65	15	111	4	2025-09-18 10:33:16.856	2025-09-18 10:33:16.856	\N	\N	f
113	24	\N	1	2025-09-24 20:19:20.496	2025-09-24 20:19:20.496	marhaba	/uploads/images/1758745160491.jpg	t
57	14	\N	2	2025-09-17 21:24:07.231	2025-09-17 21:24:15.069	\N	\N	f
69	16	\N	17	2025-09-18 12:07:49.169	2025-09-18 12:07:49.169	\N	\N	f
7	2	\N	1	2025-09-13 12:29:48.051	2025-09-13 12:29:48.051	\N	\N	f
117	25	111	4	2025-09-24 23:14:27.178	2025-09-24 23:14:27.178	\N	\N	f
12	3	80	1	2025-09-13 17:02:01.95	2025-09-13 17:02:01.95	\N	\N	f
13	3	81	1	2025-09-13 17:02:06.778	2025-09-13 17:02:06.778	\N	\N	f
114	25	\N	1	2025-09-24 23:14:10.707	2025-09-24 23:14:10.707	\N	\N	f
24	5	\N	1	2025-09-13 20:35:34.37	2025-09-13 20:35:34.37	\N	\N	f
73	18	\N	3	2025-09-20 00:58:28.125	2025-09-20 00:58:37.007	\N	\N	f
118	25	\N	1	2025-09-24 23:15:03.365	2025-09-24 23:15:03.365	jungle	/uploads/images/1758755703340.png	t
71	17	\N	4	2025-09-20 00:25:47.902	2025-09-20 00:25:51.824	\N	\N	f
192	56	1145	2	2025-11-16 17:24:05.039	2025-11-16 17:34:59.45	\N	\N	f
47	10	\N	1	2025-09-17 13:29:03.855	2025-09-17 13:29:18.825	\N	\N	f
14	3	\N	5	2025-09-13 17:02:19.404	2025-09-13 17:02:36.089	\N	\N	f
72	18	117	3	2025-09-20 00:58:19.175	2025-09-20 00:58:35.682	\N	\N	f
119	26	117	1	2025-09-25 12:21:29.652	2025-09-25 12:21:29.652	\N	\N	f
116	25	\N	1	2025-09-24 23:14:19.429	2025-09-24 23:14:19.429	\N	\N	f
44	9	117	1	2025-09-17 10:37:46.579	2025-09-17 10:37:46.579	\N	\N	f
38	7	\N	1	2025-09-14 10:30:59.348	2025-09-14 10:31:03.859	\N	\N	f
46	10	\N	2	2025-09-17 13:28:43.776	2025-09-17 13:29:14.991	\N	\N	f
110	24	\N	1	2025-09-24 20:18:56.074	2025-09-24 20:18:56.074	\N	\N	f
15	4	\N	2	2025-09-13 17:05:20.296	2025-09-13 17:06:20.249	\N	\N	f
56	13	117	3	2025-09-17 21:08:11.055	2025-09-17 21:08:23.41	\N	\N	f
112	24	\N	1	2025-09-24 20:19:00.483	2025-09-24 20:19:00.483	\N	\N	f
84	20	\N	1	2025-09-21 18:59:30.221	2025-09-21 18:59:30.221	hi	\N	t
85	21	\N	1	2025-09-21 19:06:32.881	2025-09-21 19:06:32.881	hello	/uploads/images/1758481592842.png	t
86	21	117	3	2025-09-21 19:06:49.724	2025-09-21 19:06:54.635	\N	\N	f
87	22	\N	1	2025-09-21 19:41:41.122	2025-09-21 19:41:41.122	marhaba	/uploads/images/1758483701095.jpg	t
89	22	\N	1	2025-09-21 19:56:14.699	2025-09-21 19:56:14.699	marlboro	/uploads/images/1758484574692.jpg	t
91	22	\N	1	2025-09-21 21:15:52.291	2025-09-21 21:15:52.291	hi	/uploads/images/1758489352284.png	t
92	22	\N	1	2025-09-21 22:30:23.801	2025-09-21 22:30:23.801	kjhkjhkjh	/uploads/images/1758493823788.png	t
143	38	151	3	2025-10-01 10:55:15.788	2025-10-01 10:55:15.788	\N	\N	f
144	38	152	3	2025-10-01 10:55:19.144	2025-10-01 10:55:19.144	\N	\N	f
145	38	156	3	2025-10-01 10:55:22.507	2025-10-01 10:55:22.507	\N	\N	f
58	14	\N	1	2025-09-17 21:24:21.965	2025-09-17 21:24:21.965	\N	\N	f
4	1	\N	4	2025-09-12 00:09:11.06	2025-09-12 00:11:09.707	\N	\N	f
68	16	\N	12	2025-09-18 12:07:42.985	2025-09-18 12:07:42.985	\N	\N	f
6	2	\N	7	2025-09-12 00:14:45.785	2025-09-13 12:49:05.19	\N	\N	f
115	25	\N	1	2025-09-24 23:14:14.157	2025-09-24 23:14:14.157	\N	\N	f
70	17	\N	4	2025-09-20 00:25:45.727	2025-09-20 00:25:53.221	\N	\N	f
16	4	\N	1	2025-09-13 17:07:01.143	2025-09-13 17:07:01.143	\N	\N	f
35	7	\N	2	2025-09-13 23:55:50.012	2025-09-14 02:14:12.873	\N	\N	f
39	8	\N	2	2025-09-15 16:33:09.455	2025-09-15 16:46:50.086	\N	\N	f
48	11	\N	4	2025-09-17 13:39:50.728	2025-09-17 13:40:11.066	\N	\N	f
51	12	\N	1	2025-09-17 14:03:46.839	2025-09-17 14:03:46.839	\N	\N	f
80	20	\N	1	2025-09-21 01:13:20.388	2025-09-21 01:13:20.388	\N	\N	f
88	22	\N	1	2025-09-21 19:46:11.671	2025-09-21 19:46:11.671	\N	\N	f
147	39	901	1	2025-10-01 16:06:57.445	2025-10-01 16:06:57.445	\N	\N	f
21	5	\N	1	2025-09-13 19:34:40.879	2025-09-13 20:35:49.023	\N	\N	f
49	11	\N	3	2025-09-17 13:40:01.563	2025-09-17 13:40:07.468	\N	\N	f
52	12	\N	1	2025-09-17 14:03:50.374	2025-09-17 14:03:50.374	\N	\N	f
53	13	\N	3	2025-09-17 14:06:29.563	2025-09-17 21:08:25.353	\N	\N	f
94	22	\N	1	2025-09-21 22:32:25.975	2025-09-21 22:32:25.975	\N	\N	f
148	39	903	1	2025-10-01 16:07:00.3	2025-10-01 16:07:00.3	\N	\N	f
66	15	\N	1	2025-09-18 10:33:25.699	2025-09-18 10:33:25.699	\N	\N	f
17	4	\N	1	2025-09-13 17:07:06.058	2025-09-13 17:07:06.058	\N	\N	f
8	2	\N	1	2025-09-13 12:35:41.714	2025-09-13 12:35:41.714	\N	\N	f
61	14	\N	2	2025-09-17 21:24:32.522	2025-09-17 21:24:42.978	\N	\N	f
74	18	\N	2	2025-09-20 00:58:30.807	2025-09-20 00:58:39.522	\N	\N	f
62	15	\N	4	2025-09-18 10:33:06.158	2025-09-18 10:33:06.158	\N	\N	f
5	1	\N	2	2025-09-12 00:10:29.592	2025-09-12 00:10:29.592	\N	\N	f
43	9	\N	1	2025-09-17 10:37:40.357	2025-09-17 10:37:40.357	\N	\N	f
55	13	\N	2	2025-09-17 21:08:03.899	2025-09-17 21:08:15.692	\N	\N	f
54	13	\N	2	2025-09-17 21:07:59.537	2025-09-17 21:08:06.765	\N	\N	f
37	7	\N	2	2025-09-14 00:25:55.962	2025-09-14 10:18:14.235	\N	\N	f
67	15	\N	3	2025-09-18 11:00:08.743	2025-09-18 11:00:16.662	\N	\N	f
45	10	\N	3	2025-09-17 13:28:32.094	2025-09-17 13:29:12.815	\N	\N	f
81	20	\N	1	2025-09-21 17:40:00.502	2025-09-21 17:40:00.502	\N	\N	f
146	39	\N	1	2025-10-01 16:06:51.871	2025-10-01 16:06:51.871	\N	\N	f
25	6	\N	1	2025-09-13 22:23:25.989	2025-09-13 22:23:25.989	\N	\N	f
93	22	\N	1	2025-09-21 22:31:53.802	2025-09-21 22:31:53.802	\N	\N	f
60	14	\N	1	2025-09-17 21:24:30.174	2025-09-17 21:24:30.174	\N	\N	f
111	24	\N	1	2025-09-24 20:18:58.839	2025-09-24 20:18:58.839	\N	\N	f
161	45	901	1	2025-10-02 22:58:03.13	2025-10-02 22:58:03.13	\N	\N	f
162	45	902	1	2025-10-02 22:58:04.907	2025-10-02 22:58:04.907	\N	\N	f
163	45	904	1	2025-10-02 22:58:07.639	2025-10-02 22:58:07.639	\N	\N	f
167	47	901	1	2025-10-04 19:03:30.281	2025-10-04 19:03:30.281	\N	\N	f
168	47	905	1	2025-10-04 19:03:33.894	2025-10-04 19:03:33.894	\N	\N	f
169	47	81	1	2025-10-04 19:03:38.016	2025-10-04 19:03:38.016	\N	\N	f
170	47	\N	1	2025-10-04 19:04:11.573	2025-10-04 19:04:11.573	jungle	/uploads/images/1759604651565.jpg	t
173	50	901	2	2025-10-10 22:51:47.223	2025-10-10 22:51:47.223	* ML Juul 4 Pod Strength 5% 8CT | Strength Virginia Tobacco	\N	f
174	50	907	2	2025-10-10 22:51:47.223	2025-10-10 22:51:47.223	* ML Juul 4 Pod Strength 5% 8CT | Strength Classic Menthol	\N	f
175	51	907	1	2025-10-20 00:27:06.792	2025-10-20 00:27:06.792	\N	\N	f
176	51	115	1	2025-10-20 00:27:59.901	2025-10-20 00:27:59.901	\N	\N	f
177	51	22	2	2025-10-20 00:28:14.57	2025-10-20 00:28:14.57	\N	\N	f
178	51	\N	1	2025-10-20 00:31:06.771	2025-10-20 00:31:06.771	I don't know	\N	t
179	52	115	1	2025-10-24 19:00:52.676	2025-10-24 19:00:52.676	ss green	\N	f
184	54	111	1	2025-11-09 23:03:13.523	2025-11-09 23:03:13.523	\N	\N	f
185	54	117	1	2025-11-09 23:03:21.437	2025-11-09 23:03:21.437	\N	\N	f
187	54	\N	1	2025-11-09 23:04:05.486	2025-11-09 23:04:05.486	Try again	/uploads/images/1762729445482.png	t
186	54	907	2	2025-11-09 23:03:27.905	2025-11-09 23:04:22.252	\N	\N	f
188	55	902	1	2025-11-16 14:14:07.572	2025-11-16 14:14:07.572	\N	\N	f
189	55	903	1	2025-11-16 14:14:10.734	2025-11-16 14:14:10.734	\N	\N	f
194	56	935	2	2025-11-16 17:24:15.935	2025-11-16 17:34:58.15	\N	\N	f
200	58	907	1	2025-11-20 22:07:10.378	2025-11-20 22:07:10.378	\N	\N	f
201	58	111	2	2025-11-26 22:43:33.826	2025-11-26 22:43:33.826	\N	\N	f
\.


--
-- Data for Name: inbound_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inbound_orders (id, "clientId", "orderNumber", status, "weekStartDate", deadline, "outboundOrderId", "createdAt", "updatedAt", "internalStatus") FROM stdin;
1	3	ORD-1757635191473-io4d8	SUBMITTED	2025-09-11 23:59:51.473	2025-09-18 23:59:51.473	\N	2025-09-11 23:59:51.474	2025-09-12 00:11:45.242	PENDING
51	3	WADDAH-029-19-10-2025	SUBMITTED	2025-10-20 00:27:06.767	2025-10-27 00:27:06.767	\N	2025-10-20 00:27:06.769	2025-10-20 00:31:14.775	PENDING
55	3	WADDAH-031-16-11-2025	SUBMITTED	2025-11-16 14:14:07.562	2025-11-23 14:14:07.562	\N	2025-11-16 14:14:07.563	2025-11-16 14:16:42.989	PENDING
58	3	WADDAH-033-26-11-2025	SUBMITTED	2025-11-20 22:07:10.359	2025-11-27 22:07:10.359	\N	2025-11-20 22:07:10.36	2025-11-26 22:43:45.953	PENDING
2	3	ORD-1757635191472-f3f9e	SUBMITTED	2025-09-11 23:59:51.472	2025-09-18 23:59:51.472	\N	2025-09-11 23:59:51.473	2025-09-13 13:11:30.217	PENDING
50	1	SaleOrder-QT-0006-REV1-M-20251010	SUBMITTED	2025-10-10 22:51:47.211	2025-10-17 22:51:47.211	\N	2025-10-10 22:51:47.223	2025-10-10 22:51:47.223	PENDING
52	1	SaleOrder-QT-0008-J-20251024	SUBMITTED	2025-10-24 19:00:52.674	2025-10-31 19:00:52.674	\N	2025-10-24 19:00:52.676	2025-10-24 19:00:52.676	PENDING
54	3	WADDAH-030-09-11-2025	SUBMITTED	2025-11-09 23:03:13.508	2025-11-16 23:03:13.508	\N	2025-11-09 23:03:13.51	2025-11-10 01:46:22.538	PROCESSING
56	3	WADDAH-032-16-11-2025	SUBMITTED	2025-11-16 17:24:05.019	2025-11-23 17:24:05.019	\N	2025-11-16 17:24:05.02	2025-11-16 17:35:03.141	PENDING
3	3	ORD-1757772787484-62ab6	SUBMITTED	2025-09-13 14:13:07.484	2025-09-20 14:13:07.484	\N	2025-09-13 14:13:07.485	2025-09-13 17:02:43.675	PENDING
4	3	ORD-1757772787485-yevxa	SUBMITTED	2025-09-13 14:13:07.485	2025-09-20 14:13:07.485	\N	2025-09-13 14:13:07.486	2025-09-13 17:16:41.659	PENDING
5	3	ORD-1757772787486-gtkjw	SUBMITTED	2025-09-13 14:13:07.486	2025-09-20 14:13:07.486	\N	2025-09-13 14:13:07.487	2025-09-13 20:59:16.41	PENDING
6	3	ORD-1757802205979-1x8s1	SUBMITTED	2025-09-13 22:23:25.979	2025-09-20 22:23:25.979	\N	2025-09-13 22:23:25.981	2025-09-13 22:23:33.919	PENDING
7	3	ORD-1757802268617-yr55m	SUBMITTED	2025-09-13 22:24:28.617	2025-09-20 22:24:28.617	\N	2025-09-13 22:24:28.619	2025-09-15 12:49:14.709	PENDING
8	3	ORD-1757953989427-obuox	SUBMITTED	2025-09-15 16:33:09.428	2025-09-22 16:33:09.428	\N	2025-09-15 16:33:09.435	2025-09-16 22:44:58.906	PENDING
9	3	ORD-1758063494387-njm0z	SUBMITTED	2025-09-16 22:58:14.387	2025-09-23 22:58:14.387	\N	2025-09-16 22:58:14.389	2025-09-17 10:37:59.301	PENDING
10	3	ORD-1758115712080-rqsoa	SUBMITTED	2025-09-17 13:28:32.08	2025-09-24 13:28:32.08	\N	2025-09-17 13:28:32.082	2025-09-17 13:29:23.854	PENDING
11	3	ORD-1758116390706-ly7ea	SUBMITTED	2025-09-17 13:39:50.706	2025-09-24 13:39:50.706	\N	2025-09-17 13:39:50.708	2025-09-17 13:40:42.984	PENDING
12	3	ORD-1758116811499-90o0l	SUBMITTED	2025-09-17 13:46:51.499	2025-09-24 13:46:51.499	\N	2025-09-17 13:46:51.5	2025-09-17 14:03:56.486	PENDING
13	3	ORD-1758117989542-m1fs1	SUBMITTED	2025-09-17 14:06:29.542	2025-09-24 14:06:29.542	\N	2025-09-17 14:06:29.543	2025-09-17 21:08:28.77	PENDING
14	3	ORD-1758144247210-3h1vz	SUBMITTED	2025-09-17 21:24:07.21	2025-09-24 21:24:07.21	\N	2025-09-17 21:24:07.211	2025-09-17 21:24:46.356	PENDING
15	3	WADDAH-015-18-09-2025	SUBMITTED	2025-09-18 10:33:06.144	2025-09-25 10:33:06.144	\N	2025-09-18 10:33:06.145	2025-09-18 11:02:26.933	PENDING
16	3	WADDAH-016-18-09-2025	SUBMITTED	2025-09-18 12:07:42.979	2025-09-25 12:07:42.979	\N	2025-09-18 12:07:42.98	2025-09-18 12:08:06.521	PENDING
17	3	WADDAH-017-19-09-2025	SUBMITTED	2025-09-20 00:25:45.715	2025-09-27 00:25:45.715	\N	2025-09-20 00:25:45.717	2025-09-20 00:58:03.498	PENDING
18	3	WADDAH-018-19-09-2025	SUBMITTED	2025-09-20 00:58:19.161	2025-09-27 00:58:19.161	\N	2025-09-20 00:58:19.162	2025-09-20 01:00:05.344	PENDING
19	3	WADDAH-019-20-09-2025	SUBMITTED	2025-09-20 22:02:36.401	2025-09-27 22:02:36.401	\N	2025-09-20 22:02:36.402	2025-09-21 00:40:45.564	PENDING
20	3	WADDAH-020-21-09-2025	SUBMITTED	2025-09-21 01:13:20.375	2025-09-28 01:13:20.375	\N	2025-09-21 01:13:20.376	2025-09-21 19:00:06.517	PENDING
21	3	WADDAH-021-21-09-2025	SUBMITTED	2025-09-21 19:06:32.851	2025-09-28 19:06:32.851	\N	2025-09-21 19:06:32.868	2025-09-21 19:06:57.998	PENDING
22	3	WADDAH-022-21-09-2025	SUBMITTED	2025-09-21 19:41:41.104	2025-09-28 19:41:41.104	\N	2025-09-21 19:41:41.109	2025-09-21 22:33:47.939	PENDING
24	3	WADDAH-024-24-09-2025	SUBMITTED	2025-09-24 20:18:56.06	2025-10-01 20:18:56.06	\N	2025-09-24 20:18:56.062	2025-09-24 20:19:25.013	PENDING
25	3	WADDAH-025-24-09-2025	SUBMITTED	2025-09-24 23:14:10.696	2025-10-01 23:14:10.696	\N	2025-09-24 23:14:10.698	2025-09-24 23:15:12.69	PENDING
26	3	WADDAH-026-25-09-2025	SUBMITTED	2025-09-25 12:21:29.637	2025-10-02 12:21:29.637	\N	2025-09-25 12:21:29.638	2025-09-25 12:21:40.666	PENDING
38	3	WADDAH-026-01-10-2025	SUBMITTED	2025-10-01 10:55:15.781	2025-10-08 10:55:15.781	\N	2025-10-01 10:55:15.782	2025-10-01 10:55:31.933	PENDING
39	5	NAZEK-001-01-10-2025	SUBMITTED	2025-10-01 16:06:51.853	2025-10-08 16:06:51.853	\N	2025-10-01 16:06:51.854	2025-10-01 16:07:15.525	PENDING
45	3	WADDAH-027-02-10-2025	SUBMITTED	2025-10-02 22:58:03.123	2025-10-09 22:58:03.123	\N	2025-10-02 22:58:03.125	2025-10-03 19:23:29.38	COMPLETED
47	3	WADDAH-028-04-10-2025	SUBMITTED	2025-10-04 19:03:30.264	2025-10-11 19:03:30.264	\N	2025-10-04 19:03:30.266	2025-10-04 19:06:55.332	PROCESSING
\.


--
-- Data for Name: order_controls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_controls (id, "userId", "showSalePrice", "showQuantity", "timeControlEnabled", "timeControlType", "timeControlSettings", "warningEnabled", "customMessage", "customMessageActive", "customMessageExpires", "createdAt", "updatedAt", "periodStartTime", "imagePath", "isUnlisted") FROM stdin;
19	3	f	f	f	daily	{"type": "daily", "daily": {"hours": 1}, "weekly": {"endDay": "Sunday", "endHour": 23, "startDay": "Monday", "endMinute": 59, "startHour": 0, "startMinute": 0}, "monthly": {"endDay": 31, "endHour": 23, "startDay": 1, "endMinute": 59, "startHour": 0, "startMinute": 0}}	t	hellooo	f	2025-11-26 12:44:51.367	2025-08-30 01:02:49.232	2025-11-26 12:35:40.021	\N	\N	f
100	5	f	f	f	daily	{"type": "daily", "daily": {"hours": 1}, "weekly": {"endDay": "Sunday", "endHour": 23, "startDay": "Monday", "endMinute": 59, "startHour": 0, "startMinute": 0}, "monthly": {"endDay": 31, "endHour": 23, "startDay": 1, "endMinute": 59, "startHour": 0, "startMinute": 0}}	t	goooooooooooooooooooo	f	2025-10-04 20:45:42.027	2025-10-01 16:09:59.574	2025-11-13 18:14:20.316	\N	\N	f
1	2	f	f	f	weekly	{}	f	\N	f	\N	2025-08-30 00:04:27.744	2025-08-30 17:22:53.584	\N	\N	f
\.


--
-- Data for Name: outbound_invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbound_invoice_items (id, "invoiceId", "productId", quantity, "unitPrice", "totalPrice", "createdAt", "updatedAt", "inboundItemId", "markupAmount", "markupPercentage", "unitCost") FROM stdin;
1	1	115	1	12	12	2025-10-24 22:20:04.171	2025-10-24 22:20:04.171	\N	2	20	10
2	2	908	3	12	36	2025-10-25 18:52:14.894	2025-10-25 18:52:14.894	\N	2	20	10
3	3	901	2	122.4	244.8	2025-10-26 17:38:21.173	2025-10-26 17:38:21.173	\N	20.40000000000001	20.00000000000001	102
4	3	907	2	122.4	244.8	2025-10-26 17:38:21.173	2025-10-26 17:38:21.173	\N	20.40000000000001	20.00000000000001	102
5	4	115	1	12	12	2025-10-26 17:40:38.269	2025-10-26 17:40:38.269	\N	2	20	10
6	5	115	1	12	12	2025-10-26 19:09:39.937	2025-10-26 19:09:39.937	\N	2	20	10
7	6	1123	1	24.2	24.2	2025-11-04 12:29:55.989	2025-11-04 12:29:55.989	\N	2.200000000000003	10	22
8	7	967	1	24.2	24.2	2025-11-04 13:50:23.336	2025-11-04 13:50:23.336	\N	2.200000000000003	10	22
9	7	982	1	13.2	13.2	2025-11-04 13:50:23.336	2025-11-04 13:50:23.336	\N	1.200000000000001	10	12
10	8	1123	1	24.2	24.2	2025-11-05 11:07:31.299	2025-11-05 11:07:31.299	\N	2.200000000000003	10	22
11	8	967	5	24.2	121	2025-11-05 11:07:31.299	2025-11-05 11:07:31.299	\N	11.00000000000001	10	22
12	9	902	1	9.515	9.515	2025-11-05 13:16:18.956	2025-11-05 13:16:18.956	\N	0.8650000000000002	10	8.65
13	9	967	1	24.2	24.2	2025-11-05 13:16:18.956	2025-11-05 13:16:18.956	\N	2.200000000000003	10	22
14	10	902	1	9.515	9.515	2025-11-05 20:19:58.484	2025-11-05 20:19:58.484	\N	0.8650000000000002	10	8.65
15	10	909	10	9.515	95.15	2025-11-05 20:19:58.484	2025-11-05 20:19:58.484	\N	8.650000000000002	10	8.65
16	11	902	10	9.515	95.15	2025-11-05 20:28:50.213	2025-11-05 20:28:50.213	\N	8.650000000000002	10	8.65
17	11	1117	1	9.515	9.515	2025-11-05 20:28:50.213	2025-11-05 20:28:50.213	\N	0.8650000000000002	10	8.65
18	12	115	1	12	12	2025-11-05 23:41:24.775	2025-11-05 23:41:24.775	\N	2	20	10
19	13	902	1	9.515	9.515	2025-11-06 01:22:13.956	2025-11-06 01:22:13.956	\N	0.8650000000000002	10	8.65
\.


--
-- Data for Name: outbound_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbound_invoices (id, "clientId", "inboundInvoiceId", "invoiceNumber", status, "totalAmount", "createdAt", "updatedAt", "balanceDue", "baseCost", "customerId", discount, "dueDate", "issueDate", "markupAmount", "markupPercentage", notes, "paidAmount", "paidAt", "paymentMethod", "paymentStatus", "sentAt", "shipmentStatus", "shippingAddress", subtotal, "taxAmount", "taxRate", terms, "trackingNumber", "viewedAt") FROM stdin;
1	1	\N	INV-0001	SENT	12	2025-10-24 22:20:04.171	2025-10-24 22:21:12.628	12	\N	3	0	2025-11-23 00:00:00	2025-10-24 00:00:00	\N	\N		0	\N	\N	PENDING	2025-10-24 22:21:12.627	PENDING		12	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
2	1	\N	INV-0002	PAID	36	2025-10-25 18:52:14.894	2025-10-25 18:52:25.893	36	\N	2	0	2025-11-24 00:00:00	2025-10-25 00:00:00	\N	\N		0	\N	CASH	PENDING	2025-10-25 18:52:18.963	PENDING	on site Delivery	36	0	0		\N	\N
3	1	\N	INV-0003	DRAFT	489.6	2025-10-26 17:38:21.173	2025-10-26 17:38:21.173	489.6	\N	\N	0	2025-11-25 00:00:00	2025-10-26 00:00:00	\N	\N		0	\N	\N	PENDING	\N	PENDING		489.6	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
4	1	\N	INV-0004	DRAFT	12	2025-10-26 17:40:38.269	2025-10-26 17:40:38.269	12	\N	\N	0	2025-10-27 00:00:00	2025-10-26 00:00:00	\N	\N		0	\N	CASH	PENDING	\N	PENDING		12	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
5	1	\N	INV-0005	SENT	12	2025-10-26 19:09:39.937	2025-10-29 13:52:44.164	12	\N	\N	0	2025-11-25 00:00:00	2025-10-26 00:00:00	\N	\N		0	\N	\N	PENDING	2025-10-29 13:52:44.162	PENDING		12	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
6	1	\N	INV-0006	DRAFT	24.2	2025-11-04 12:29:55.989	2025-11-04 12:29:55.989	24.2	22	4	0	2025-12-04 12:29:55.9	2025-11-04 12:29:55.9	2.200000000000003	9.090909090909102		0	\N	\N	PENDING	\N	PENDING	NC,Charlotte	24.2	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
7	1	\N	INV-0007	SENT	37.40000000000001	2025-11-04 13:50:23.336	2025-11-04 13:50:23.336	37.40000000000001	34	1	0	2025-12-04 13:50:23.04	2025-11-04 13:50:23.04	3.400000000000006	9.090909090909104		0	\N	\N	PAID	\N	PENDING	jobeiha	37.40000000000001	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
8	1	\N	INV-0008	DRAFT	145.2	2025-11-05 11:07:31.299	2025-11-05 11:07:31.299	145.2	132	1	0	2025-12-05 11:07:31.169	2025-11-05 11:07:31.169	13.20000000000002	9.090909090909102		0	\N	\N	PENDING	\N	PENDING	jobeiha	145.2	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
9	1	\N	INV-0009	PAID	37.0865	2025-11-05 13:16:18.956	2025-11-05 13:16:18.956	37.0865	30.65	2	0	2025-12-05 13:16:18.795	2025-11-05 13:16:18.795	3.065000000000005	9.090909090909104		0	\N	CASH	PENDING	\N	PENDING	USA NC	33.715	3.3715	10	Payment due within 30 days. Late payments subject to fees.	\N	\N
10	1	\N	INV-0010	DRAFT	104.665	2025-11-05 20:19:58.484	2025-11-05 20:19:58.484	104.665	95.15	3	0	2025-12-05 20:19:58.439	2025-11-05 20:19:58.439	9.515	9.090909090909092		0	\N	\N	PENDING	\N	PENDING	CA	104.665	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
11	1	\N	INV-0011	DRAFT	104.665	2025-11-05 20:28:50.213	2025-11-05 20:28:50.213	104.665	95.15	1	0	2025-12-05 20:28:50.15	2025-11-05 20:28:50.15	9.515	9.090909090909092		0	\N	\N	PENDING	\N	PENDING	jobeiha	104.665	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
12	1	\N	INV-0012	DRAFT	12	2025-11-05 23:41:24.775	2025-11-05 23:41:24.775	12	\N	2	0	2025-12-05 00:00:00	2025-11-05 00:00:00	\N	\N		0	\N	CASH	PENDING	\N	PENDING		12	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
13	1	\N	INV-0013	DRAFT	9.515	2025-11-06 01:22:13.956	2025-11-06 01:22:13.956	9.515	8.65	4	0	2025-12-06 01:22:13.855	2025-11-06 01:22:13.855	0.8650000000000002	9.090909090909092		0	\N	\N	PENDING	\N	PENDING	NC,Charlotte	9.515	0	0	Payment due within 30 days. Late payments subject to fees.	\N	\N
\.


--
-- Data for Name: outbound_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbound_order_items (id, "orderId", "productId", quantity, "unitPrice", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: outbound_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbound_orders (id, "supplierId", "clientId", "orderNumber", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, "partNo", "costPrice", "markupPercentage", "salePrice", "categoryId", image, "createdAt", "updatedAt", "minStockLevel", quantity) FROM stdin;
886	dafdaf	315121	9	20	10.8	3	\N	2025-10-01 09:16:00.692	2025-10-01 09:16:00.692	10	0
1138	updateproductapi	654654	10	20	12	9	/uploads/images/1762604248829.webp	2025-11-08 12:17:28.834	2025-11-08 12:17:28.834	10	\N
1224	Tob L/L Stoker 3OZ Pouches Red Supreme $1.99 (C12) | Bold	799953039525	15.99	20	19.188	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	31
908	Test	8787	10	20	12	7	/uploads/images/1760964215652.webp	2025-10-20 12:43:35.658	2025-10-20 12:43:35.658	10	1
1255	delete me	65486	10	20	12	7	\N	2025-11-08 23:08:27.369	2025-11-08 23:08:45.381	10	\N
907	* ML Juul 4 Pod Strength 5% 8CT | Strength Classic Menthol	10819913012591	102	20	122.4	70	/uploads/images/1759605344250.webp	2025-10-04 19:14:18.742	2025-11-08 23:12:00.224	10	6
1256	Test After sec	6546874	25	20	30	8	/uploads/images/1763762360712.webp	2025-11-21 21:59:20.716	2025-11-21 21:59:20.716	10	1
913	Backwoods 8CT/5PK (C30) | Dark Stout	071610302730	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
914	Backwoods 8CT/5PK (C30) | Honey	0410181181458	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	6
915	Backwoods 8CT/5PK (C30) | Honey Berry	071610301870	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	20
916	Backwoods 8CT/5PK (C30) | Nola Banana Foster	071610341739	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	5
918	Backwoods 8CT/5PK (C30) | Sweet Aromatic	071610301924	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	36
919	Backwoods 8CT/5PK (C30) | Tical	071610341760	30	20	36	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1225	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Cognac & Honey	860010326282	16	20	19.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1226	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Dark	850059190029	16	20	19.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
19	snuf very large	9797	45	20	54	2	\N	2025-08-23 20:04:11.381	2025-08-23 20:04:11.381	10	0
933	Black Stone Cherry Tip 10PK 10CT Value Pack 1/20 10	025900293345	45.5	20	54.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	24
934	Bluntville $1.29C Pre-Priced 25CT (C50) | Blue	819721012397	16.5	20	19.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1227	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Dark White	850059190463	16	20	19.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
22	123123	\N	\N	20	\N	2	\N	2025-08-23 22:08:30.035	2025-08-23 22:08:30.035	10	0
938	Bluntville 25CT (C50) | Grape	819721010355	17	20	20.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
945	Djarum 10PKct/12CT (C40) | Ultra Menthol/Sapphire	751667290029	43.75	20	52.5	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	5
947	Dutch Master 3CT/$1.99 20CT (C16) | Palma	071610495883	24.5	20	29.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	16
905	4 Kings 4 For $1.19 15CT (C24) | Melonberry	842426165426	8.65	20	10.38	68	\N	2025-10-01 15:59:18.571	2025-11-08 23:12:00.224	10	5
952	Dutch Master Cigarillo 20CT (C16) | Palma	071610499508	33.5	20	40.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	19
110	blunt	8000	1	20	1.2	8	\N	2025-08-26 15:58:05.723	2025-09-29 22:42:31.261	10	2
115	ss green	13000	10	20	12	9	\N	2025-08-26 16:17:04.359	2025-09-29 22:42:31.261	10	2
111	pink	10000	1	20	1.2	8	/uploads/images/1762650836106.webp	2025-08-26 15:58:05.723	2025-11-09 01:13:56.109	10	2
957	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Irish	071610341227	24	20	28.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
960	Gambler 200CT 100Mm Cigarette Tube (C50) | Lights 100 GLFTC	077170260664	3.25	20	3.9	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
961	Gambler 200CT 100Mm Cigarette Tube (C50) | Regular GRFTC	077170260640	3.25	20	3.9	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
962	Gambler 200CT 100Mm Tubecut Cigarette Tube (C50) | Gold GTFLL	077170260763	3.25	20	3.9	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
963	Gambler 200CT 100Mm Tubecut Cigarette Tube (C50) | Regular GTFRL	077170260725	3.25	20	3.9	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
964	Gambler 200CT King Size Cigarette Tube (C50) | Regular GRT20	077170260220	2.49	20	2.988	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
965	Gambler 200CT Kingsize Tubecut Cigarette Tube (C50) | Lights 100 GTFLK	077170260749	2.49	20	2.988	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
966	Gambler 200CT Kingsize Tubecut Cigarette Tube (C50) | Regular GTFRK	077170260701	2.49	20	2.988	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	25
953	Dutch Master Cigarillo 20CT/2CT (C15) | Palma	071610499331	44	20	52.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
1228	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Russian Cream	860010326275	16	20	19.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1229	Tob Lil Leaf 10CT/5PK (C30) | Cognac & Honey	860009348363	38.49	20	46.188	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1230	Tob Loose Leaf  5/8PK 40CT (C40) | Ice Cold	658238734800	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1231	Tob Loose Leaf  5/8PK 40CT (C40) | Red Rum	658238735029	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
979	Game Leaf 2CT/$1.29 15CT (C24) | Sweet Aromatic	031700234860	11.5	20	13.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
981	Game Leaf 5CT/$2.99 8CT (C24) | Black Raspberry	031700238936	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1232	Tob Loose Leaf Wrap 5/8PK 40CT (C40) | Natural Dark	616663964902	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
80	lol	11	10	20	12	3	\N	2025-08-25 20:59:34.896	2025-08-25 20:59:34.896	10	0
81	malibo	999111	12	20	14.4	3	\N	2025-08-25 22:16:04.465	2025-08-25 22:16:04.465	10	0
1233	Tob Loose Leaf Wrap 5/8PK 40CT (C40) | Russian Cream	616663964933	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1234	Tob Loose Leaf Wrap 5/8PK 40CT (C40) | Strawberry Dream	660111933682	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1235	Tob Loose Leaf Wrap 5/8PK 40CT Honey Bourbon 1/40 40	616663964971	22	20	26.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
985	Game Special Reserve 15CT (C28)	031700238943	15	20	18	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1236	Tob Slapwoods Wraps 10CT (C20) | Natural	796559467110	33	20	39.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
987	Good Times #Hd 3CT/$1.29 15CT (C24) | Cognac	842426166928	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1237	Tob Snuff Rail Road Sweet 12 Blue (C12)	033300511129	126	20	151.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1238	Tob Snuff Square 12CT  2 (C12)	033300611171	126	20	151.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
954	Dutch Master Cigarillo 3Pk 20CT (C16) | Russian Cream	071610340183	33.99	20	40.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	4
992	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Banana	842426170529	12	20	14.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
117	Dutch blue	66666	50	20	60	11	\N	2025-08-27 13:42:42.207	2025-08-27 13:42:42.207	10	0
888	try2	321	9.98	20	11.976	3	\N	2025-10-01 12:33:01.64	2025-10-01 12:33:01.64	10	\N
999	Good Times Black Smooth 69C 15CT (C25) | Wine	842426181716	5.25	20	6.3	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1000	Good Times Wrap 79C 2PK 25CT (C25) | Black	818892014254	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1001	Good Times Wrap 79C 2PK 25CT (C25) | Cherry	812319010805	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1002	Good Times Wrap 79C 2PK 25CT (C25) | Fruit Punch	818892016555	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1003	Good Times Wrap 79C 2PK 25CT (C25) | Mangolicious	812319010355	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1004	Good Times Wrap 79C 2PK 25CT (C25) | Natural	812319010546	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1140	4 Kings 4 For $1.19 15CT (C24) | Black Diamond	842426171458	8.65	20	10.38	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1141	4 Kings 4 For $1.19 15CT (C24) | Black Sweet	842426165211	8.65	20	10.38	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
151	Tob Snuff Tops Sweet Tc Blue    (C12)	33300518302	37	20	44.4	13	\N	2025-08-27 22:48:57.051	2025-08-27 22:48:57.051	10	0
152	White Owl 2CT/$1.19 30CT/2PK (C12) | Mango	31700237779	20.5	20	24.6	13	\N	2025-08-27 22:48:57.051	2025-08-27 22:48:57.051	10	0
1142	4 Kings 4 For $1.19 15CT (C24) | Classic Green	842426172059	8.65	20	10.38	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1143	4 Kings 4 For $1.19 15CT (C24) | Watermelon Grape	842426165549	8.65	20	10.38	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
162	ss red	11000	10	20	12	15	\N	2025-08-31 22:47:48.452	2025-09-29 22:42:31.261	10	2
156	winston	76149276	2.5	20	3	13	\N	2025-08-27 22:48:57.051	2025-08-27 22:48:57.051	10	0
1145	Backwoods 8CT/5PK (C30) | Dark Berry	071610341548	30.5	20	36.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1005	Good Times Wrap 79C 2PK 25CT (C25) | Peach	812319010560	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1006	Good Times Wrap 79C 2PK 25CT (C25) | Watermelon	812319010836	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1007	High Hemp Wraps 2CT/25PK (C50) | Flora Passion	719499005617	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1008	Optimo 2CT/$99C 30CTct/2PK (C24) | Diamond	025900444143	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1009	Optimo 2CT/$99C 30CTct/2PK (C24) | Grape	025900443108	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1010	Optimo 2CT/$99C 30CTct/2PK (C24) | Green	025900443030	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1011	Optimo 2CT/$99C 30CTct/2PK (C24) | Sweet	025900443016	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1012	Phillies Blunt 10CT/5PK (C30) | Regular	070235108512	39.99	20	47.988	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	18
1014	Pipe Tobacco Bag Cherokee 16OZ (C12) | Mellow Blue	607122100023	10.5	20	12.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1015	Pipe Tobacco Bag Cherokee 16OZ (C12) | Original Red	607122100016	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1019	Royal Blunts Ez Roll 25CT (C100) | Atomic Blast	619682009968	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1020	Royal Blunts Ez Roll 25CT (C100) | Blueberry	619682010124	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1021	Royal Blunts Ez Roll 25CT (C100) | Jamaica Rum	619682621320	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1022	Royal Blunts Ez Roll 25CT (C100) | Sour Apple	619682010360	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1023	Royal Blunts Ez Roll 25CT (C100) | Strawberry Banana	619682009906	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1024	Royal Blunts Ez Roll 25CT (C100) | Wet Mango	619682621221	6.5	20	7.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1025	Shargio Cigarette Tube 250CT 100Mm (C40) | Blue	816568010234	2.59	20	3.108	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	20
1026	Shargio Cigarette Tube King Size 200CT (C40) | Blue + 50CT Free	816568010357	2.19	20	2.628	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	20
1027	Show 5CT/$1 15CT (C24) | Blue Palma	858765004647	7.9	20	9.48	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1028	Show 5CT/$1 15CT (C24) | Green Sweet	817127029544	7.9	20	9.48	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1029	Swisher Sweets 2CT/$1.19 30CT/2PK (C24) | Blue Berry	025900287351	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1031	Swisher Sweets 2CT/$1.19 30CT/2PK (C24) | Peach	025900284305	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1033	Swisher Sweets 2CT/$99C 30CT/2PK (C24) | Peach	025900294243	16.5	20	19.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1035	Swisher Sweets Blk 2CT/$1.49 15CT/2PK (C48) | Grape	025900325732	13.25	20	15.9	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1146	Bag Blaze 1/10 Small Thank You Printed Black Bag White Box 1000CT	9103416116264	8.5	20	10.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1147	Bag Blaze 1/8 Thank You Printed Black T-Shirt Bag White Box 800Ct (No Barcode)	605126633318	11.99	20	14.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1045	Swisher Sweets Mini Foil 3 For 2 15CT/3PK (C24) | Island Bash	025900240929	15	20	18	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1046	Swisher Sweets Mini Foil 3 For 2 15CT/3PK (C24) | Reg	025900240806	15	20	18	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1048	Tob Backwood True Wraps 16CT/5PK (C15) | Aromatic	071610341685	58	20	69.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1049	Tob Big Dog Broad Leaf Pp $1.99 20/2PK (C24) | Aromatic	817127027953	20	20	24	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1051	Tob Big Dog Broad Leaf Pp $1.99 20/2PK (C24) | Russian Cream	817127028035	20	20	24	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	5
1053	Tob Fronto King Dark Crush 12G 1CT Bottle (C24)	750122786671	2	20	2.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	48
1054	Tob L/L Beechnut $4.29 12CT 3OZ  (C12)	035106057146	31	20	37.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1148	Black N Mild 10CT/5PK (C30) | Cream	070137500421	44	20	52.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1149	Black N Mild 10CT/5PK (C30) | Filter Tip	070137513377	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	7
1150	Black N Mild 10CT/5PK (C30) | Filter Tip Sweet	070137513728	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	9
1062	Tob L/L Levi Garret Reg 3OZ (C12)	042100007725	206	20	247.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	6
1151	Black N Mild 10CT/5PK (C30) | Original	070137500186	44	20	52.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	18
1152	Black N Mild 10CT/5PK Wood Tip (C30) | Jazz	070137511168	49	20	58.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	7
1065	Tob L/L Stoker 16OZ - 6CT (C4) | Classic	799953001119	74	20	88.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1153	Black N Mild 10CT/5PK Wood Tip (C30) | Wine	070137505297	49	20	58.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1154	Black N Mild 5 For 4 (C30) | Jazz	070137515593	35	20	42	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	9
1077	Tob Slapwoods Wraps 10CT (C20) | Bloodshot	796559467196	32	20	38.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1078	Tob Slapwoods Wraps 10CT (C20) | Dark Edition	796559467103	32	20	38.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	5
1079	Tob Slapwoods Wraps 10CT (C20) | Russian Cream	738607282948	32	20	38.4	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1080	Tob Snuff Copenhagen 5CT Can (C18) | Long Cut	073100014611	26	20	31.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1081	Tob Snuff Copenhagen 5CT Can (C18) | Pouches Regular	073100014772	26	20	31.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1082	Tob Snuff Copenhagen 5CT Can (C18) | Regular Snuff	073100010897	26	20	31.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1083	Tob Snuff Dental Scotch Yellow 12CT (C12)	42100001365	179.99	20	215.988	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	6
1084	Tob Snuff Dental Sweet 12CT   (C12)	42100001761	180.5	20	216.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	7
1155	Black N Mild 99C 25CT (C30) | Sweets	070137514237	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	14
1156	Bluntville $1.29C Pre-Priced 25CT (C50) | Piff	819721012458	17	20	20.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1157	Bob Marley Hemp Wraps 2/25PK (C50) | Natural	10857545012046	11.99	20	14.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1158	Bob Marley Hemp Wraps 2/25PK (C50) | Strawberry	10857545012077	11.99	20	14.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1159	Cheyenne Filtered Cigar (C60) | Peach	874411000719	12.99	20	15.588	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	8
1160	Cheyenne Filtered Cigar (C60) | Vanilla	874411000726	12.99	20	15.588	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	9
1161	Cheyenne Filtered Cigar (C60) | Xotic Berry	874411000733	12.99	20	15.588	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1085	Tob Snuff Kayak 10CT Can (C18) | Long Cut Apple	033300616770	21	20	25.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	18
1086	Tob Snuff Kayak 10CT Can (C18) | Long Cut Grape	033300616688	21	20	25.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1088	Tob Snuff Kayak 10CT Can (C18) | Long Cut Wintergreen	033300616930	21	20	25.2	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	18
1162	Djarum 10PKct/12CT (C40) | Bali Hai	751667074346	43.89	20	52.668	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	9
1091	Tob Snuff Skoal 5CT Can (C18) | Fine Cut Wintergreen	073100010934	26.5	20	31.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	18
1092	Tob Snuff Skoal 5CT Can (C18) | Long Cut Cherry	073100011030	26.5	20	31.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1093	Tob Snuff Skoal 5CT Can (C18) | Long Cut Mint	073100010972	26.5	20	31.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1094	Tob Snuff Skoal 5CT Can (C18) | Long Cut Peach	073100019067	26.5	20	31.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1095	Tob Snuff Skoal 5CT Can (C18) | Long Cut Wintergreen	073100010958	26.5	20	31.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1163	Djarum 10PKct/12CT (C40) | Clove Splash	751667074223	43.89	20	52.668	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1164	Djarum 10PKct/12CT (C40) | Menthol/Emerald	751667090667	43.89	20	52.668	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1165	Djarum 10PKct/12CT (C40) | Mild Select	751667074261	43.89	20	52.668	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	5
1100	Tob Up Leef Grabba Whole Leaf 5OZ 6CT  (C24)	040835640750	14	20	16.8	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1101	Tob Up Leef Red Rose Blend 12G 1CT Bottle  (C24)	787269093218	1.89	20	2.268	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	48
1102	Tob Zig Zag Wrap 2F99 25CT (C25) | Apple	784762071613	13	20	15.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1103	Tob Zig Zag Wrap 2F99 25CT (C25) | Pineapple	784762071743	13	20	15.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1104	Tob Zig Zag Wrap 2F99 25CT (C25) | Strawberry	784762071668	13	20	15.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1106	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Blueberry	784762078216	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	4
1107	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Daimond	784762077325	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	2
1108	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Grape	784762078117	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1109	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Green	784762078810	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	3
1114	White Owl 2CT/$1.19 30CT/2PK (C12) | Triple Grape	031700238394	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1115	White Owl 2CT/$1.19 30CT/2PK (C12) | Tropical Twist	031700237847	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-10-30 22:10:30.518	10	1
1166	Djarum 10PKct/12CT (C40) | Ultra Smooth / Silver	751667313704	43.89	20	52.668	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1167	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Blue Dream Fusion	071610341203	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1056	Tob L/L Big Duke 6CT-16OZ Pre-Priced $9.99 (C4) | Original	070195596169	40	20	48	68	\N	2025-10-30 22:10:30.518	2025-10-31 19:43:45.878	10	44
901	* ML Juul 4 Pod Strength 5% 8CT | Strength Virginia Tobacco	10819913011426	102	20	122.4	68	/uploads/images/1759663799368.webp	2025-10-01 15:59:18.571	2025-11-08 23:12:00.224	10	4
902	4 Kings 4 For $1.19 15CT (C24) | Blueberry Pineapple	842426165242	8.65	20	10.38	68	\N	2025-10-01 15:59:18.571	2025-11-08 23:12:00.224	10	33
903	4 Kings 4 For $1.19 15CT (C24) | Green Sweet	842426165334	8.65	20	10.38	68	\N	2025-10-01 15:59:18.571	2025-11-08 23:12:00.224	10	10
904	4 Kings 4 For $1.19 15CT (C24) | Mango	842426165396	8.65	20	10.38	68	\N	2025-10-01 15:59:18.571	2025-11-08 23:12:00.224	10	29
1117	4 Kings 4 For $1.19 15CT (C24) | Diamond	842426165273	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1118	4 Kings 4 For $1.19 15CT (C24) | French Vanilla	842426165303	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1168	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Diamond	071610341333	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1169	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Gold	071610341234	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	6
1170	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Green Envy	071610341678	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	14
1171	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Og	071610341241	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1172	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Platinum	071610341081	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1173	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Sweet Fusion	071610341180	23.99	20	28.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1174	Entourage 25CT (C40) | Le Prive	705105723761	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	5
1175	Entourage 25CT (C40) | Pink Vanilla	819721010676	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1176	Entourage 25CT (C40) | Vanilla	819721010683	18	20	21.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	6
1177	Game 2 For $1.29 30CT (C12) | Honey	031700237915	21.99	20	26.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	10
1178	Game 2 For $1.29 30CT (C12) | Mango	031700237984	21.99	20	26.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	8
1179	Game 2 For $1.29 30CT (C12) | Red Sweets	031700238028	21.99	20	26.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	24
1180	Game Leaf 2CT/$1.49 15CT (C24) | Dark	031700238677	12.99	20	15.588	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	16
1181	Good Times #Hd 3CT/$1.29 15CT (C24) | Sweet	842426167109	9.75	20	11.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1182	Good Times #Hd 3CT/$1.29 15CT (C24) | Vanilla	842426167161	9.75	20	11.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1183	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Classic	842426170581	12.25	20	14.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1184	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Cognac	842426170796	12.25	20	14.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1185	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Golden Honey	842426170765	12.25	20	14.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1186	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Honey Berry	842426170826	12.25	20	14.7	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1187	Good Times Black Smooth 69C 15CT (C25) | Blueberry	842426181532	5.25	20	6.3	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1188	Good Times Black Smooth 69C 15CT (C25) | Peach	842426181747	5.25	20	6.3	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1189	Good Times Black Smooth 69C 15CT (C25) | Sweet	842426182225	5.25	20	6.3	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1124	CGR Game 2 For $1.29 30CT (C12) | Grape	031700237939	22	20	26.4	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	12
1190	King Palm Pouch 2PK Mini Rolls 20CT (C40) | Margarita	10854029008717	26.99	20	32.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1191	Lgt Bic 50CT (C6) | Reg CT+3	070330644809	47	20	56.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	6
1192	Lighter Great Lite Clear 50CT (C20)	756545704629	4.5	20	5.399999999999999	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	25
1193	Pipe Tobacco Bag Ohm 16OZ (C24) | Bold	894945001419	9.49	20	11.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1194	Pipe Tobacco Bag Ohm 16OZ (C24) | Natural	894945001440	9.49	20	11.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1195	Pipe Tobacco Bag Ohm 16OZ (C24) | Turkish Red	894945001839	9.49	20	11.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1128	CGR Good Times #Hd 3CT/$1.29 15CT (C24) | Honey	842426166980	10	20	12	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	24
988	CGR Good Times #Hd 3CT/$1.29 15CT (C24) | Honey Fusion	842426166836	10	20	12	68	\N	2025-10-30 22:10:30.518	2025-10-31 19:43:45.878	10	24
1130	CGR Good Times #Hd Palma $1.29 10CT (C24) | Blue	842426164078	7.5	20	9	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	24
1131	CGR Swisher Sweets Blk 2CT/$1.49 30CT/2PK (C24) | Berry	025900336905	25	20	30	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	24
1132	CGR Swisher Sweets Blk 2CT/$1.49 30CT/2PK (C24) | Smooth	025900336875	25	20	30	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	48
1133	CGR Swisher Sweets Blk 2CT/$1.49 30CT/2PK (C24) | Wine	025900336912	25	20	30	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	24
1135	Tob Longhorn Tub 14.4OZ $2.50 Off (C8) | Longcut Wintergreen	762446404025	11.99	20	14.388	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	72
1136	Tob Snuff Honey Bee Sweet Tc 1CT (C12)	033300518104	37	20	44.4	72	\N	2025-10-31 00:57:25.872	2025-10-31 19:43:45.878	10	48
1097	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Fine Cut Natural	799953209300	14	20	16.8	68	\N	2025-10-30 22:10:30.518	2025-10-31 19:43:45.878	10	24
1196	Pipe Tobacco Bag Ohm 16OZ (C24) | Yellow	894945001846	9.49	20	11.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1197	Pipe Tobacco Bag Ohm 6OZ (C36) | Mentho Gold	894945001679	4.2	20	5.04	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1198	Pipe Tobacco Bag Ohm 6OZ (C36) | Natural	894945001402	4.25	20	5.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1199	Pipe Tobacco Bag Ohm 6OZ (C36) | Red	894945001853	4.25	20	5.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1200	Pipe Tobacco Bag Ohm 6OZ (C36) | Silver	894945001396	4.25	20	5.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	8
1201	Pipe Tobacco Bag Ohm 6OZ (C36) | Yellow	894945001860	4.25	20	5.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1202	Raw Cone Classic Black 1.25 32CT/6 Cones (C32)	716165252054	34	20	40.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1203	Raw Cone Organic 1.25 32CT/6 Cones (C32)	716165201960	27.99	20	33.58799999999999	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1204	Raw Cone Organic King Size 32CT/3 Cones (C32)	716165202110	26.5	20	31.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1205	Red Bull 8.4OZ-24CT | Regular Small	611269991000	36.99	20	44.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1206	Red Bull 8.4OZ-24CT | Total Zero	611269623727	36.99	20	44.388	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1207	Show 5CT/$1 15CT (C24) | Lemon Ice	817127027441	8	20	9.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1208	Show 5CT/$1 15CT (C24) | Peach Mango Tata	858765005880	8	20	9.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1209	Show 5CT/$1 15CT (C24) | Pineapple Buzz	858765005842	8	20	9.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1210	Show 5CT/$1 15CT (C24) | Sweet	858765005828	8	20	9.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1211	Show 5CT/$1 15CT (C24) | Wet & Fruity	858765008676	8	20	9.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1212	Swisher Sweets 2CT/$1.19 30CT/2Pk (C24) | Tropical	025900329860	20.89	20	25.068	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1213	Swisher Sweets 2CT/$99C 30CT/2PK (C24) | Wild Rush	025900453381	16.5	20	19.8	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1214	Swisher Sweets Mini Foil 3 For 2 15CT/3PK (C24) | Diamond	025900240790	15.25	20	18.3	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1215	Talon Filtered Cigar (C30) | Regular	071737451298	9.25	20	11.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1216	Talon Filtered Cigar (C30) | Silver	071737451328	9.25	20	11.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	3
1217	Talon Filtered Cigar (C30) | Sweet Original	071737451236	9.25	20	11.1	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1218	Tob American Club 16OZ (C20) | Blue Light	844504002975	9.5	20	11.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	5
1219	Tob American Club 16OZ (C20) | Menthol	844504002951	9.5	20	11.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1220	Tob Big Dog Broad Leaf Pp $1.99 20/2PK (C24) | Blueberry Cookies Leaf	817127028387	20	20	24	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1221	Tob L/L Big Duke 3OZ Pouches $1.99 (C12) | Southern Blend	070195596275	15.99	20	19.188	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1222	Tob L/L Big Duke 6CT-16OZ Pre-Priced $9.99 (C4) | Sweet Blend	070195596312	41	20	49.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1223	Tob L/L Days Work Plug 15CT (C10)	070195354035	135	20	162	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1239	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Fine Cut Wintergreen	799953210306	13.99	20	16.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1240	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Longcut Natural	799953209201	13.99	20	16.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1241	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Longcut Wintergreen	799953210207	13.99	20	16.788	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	78
1242	Tob Snuff Superior 12CT   2 (C12)	033300611249	126	20	151.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1243	Tob Snuff Tops Sweet Tc Blue    (C12)	033300518302	37	20	44.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	12
1244	Tob Snuff Tube Rose 12CT (Tp) 1.5OZ (C12)	42100002041	181	20	217.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	4
1245	Tob Zig Zag Wrap 2F99 25CT (C25) | Grape	784762071583	12.99	20	15.588	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1246	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Purple	784762078414	9.5	20	11.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1247	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Sweet	784762078711	9.5	20	11.4	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1248	White Owl 2CT/$1.19 30CT/2PK (C12) | Blue Raspberry	031700237762	20.5	20	24.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	14
1249	White Owl 2CT/$1.19 30CT/2PK (C12) | Emerald	031700237731	20.5	20	24.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	12
1250	White Owl 2CT/$1.19 30CT/2PK (C12) | Green Sweets	031700237748	20.5	20	24.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	11
1251	White Owl 2CT/$1.19 30CT/2PK (C12) | Mango	031700237779	20.5	20	24.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	2
1252	White Owl 2CT/$1.19 30CT/2PK (C12) | Swirl Chocolate & Vanilla	031700237885	20.5	20	24.6	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	12
1253	White Owl Cig 2F99C 30CT (C12) | Cherry Vanilla	031700238547	17.5	20	21	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
1254	White Owl Newyorker 10/5PK (C24)	031700001530	33.5	20	40.2	74	\N	2025-11-08 20:12:49.378	2025-11-08 20:12:49.378	10	1
909	4 Kings 4 For $1.19 15CT (C24) | Kiwi Berry	842426165365	8.65	20	10.38	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	26
1119	4 Kings 4 For $1.19 15CT (C24) | Napa Grape	842426165457	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1120	4 Kings 4 For $1.19 15CT (C24) | Sweet Delicious	842426165488	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1121	4 Kings 4 For $1.19 15CT (C24) | Watermelon	842426165518	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	26
1122	4 Kings 4 For $1.19 15CT (C24) | White Grape	842426165570	8.65	20	10.38	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	26
910	Backwoods 10CT/3PK (C30) | Russian Cream	071610340473	24	20	28.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
911	Backwoods 24CT (C25) | Russian Cream	071610303089	21	20	25.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	4
912	Backwoods 8CT/5PK (C30) | Banana	071610340565	30.5	20	36.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	5
917	Backwoods 8CT/5PK (C30) | Russian Cream	071610302808	30.5	20	36.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	42
920	Backwoods 8CT/5PK (C30) | Vanilla	071610340848	30.5	20	36.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	10
921	Black N Mild 10CT/5PK (C30) | Apple	070137500889	44	20	52.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	4
922	Black N Mild 10CT/5PK (C30) | Select	070137500384	44	20	52.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
923	Black N Mild 10CT/5PK (C30) | Wine	070137000235	44	20	52.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	13
924	Black N Mild 10CT/5PK Wood Tip (C30) | Original	070137505259	49	20	58.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	9
925	Black N Mild 25CT (C30) | Jazz	070137511212	22	20	26.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
926	Black N Mild 25CT (C30) | Original	070137005186	21.75	20	26.1	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	73
927	Black N Mild 25CT (C30) | Wine	070137005230	21.75	20	26.1	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
928	Black N Mild 25CT Wood Tip (C30) | Jazz	070137511229	24.75	20	29.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	9
929	Black N Mild 25CT Wood Tip (C30) | Original	070137525257	24.75	20	29.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	23
930	Black N Mild 25CT Wood Tip Nice Price (C30) | Sweet	070137515630	24.75	20	29.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	15
931	Black N Mild 99C 25CT (C30) | Casino	070137512776	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	11
932	Black N Mild 99C 25CT (C30) | Original	070137824152	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	50
935	Bluntville $1.29C Pre-Priced 25CT (C50) | Palma Trio	819721012335	17	20	20.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	13
936	Bluntville $1.29C Pre-Priced 25CT (C50) | Pink Diva	819721012427	17	20	20.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	15
937	Bluntville $1.29C Pre-Priced 25CT (C50) | Triple Vanilla	819721012366	17	20	20.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	76
939	Cheyenne Filtered Cigar (C60) | Menthol	874411000696	12.99	20	15.588	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
940	Cheyenne Filtered Cigar (C60) | Strawberry	039517818365	12.99	20	15.588	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	12
941	Cheyenne Filtered Cigar (C60) | W/Cherry	874411000702	12.99	20	15.588	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	13
942	Djarum 10PKct/12CT (C40) | Black	751667046947	43.89	20	52.668	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	11
943	Djarum 10PKct/12CT (C40) | Cherry/Ruby	751667067546	43.89	20	52.668	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	10
944	Djarum 10PKct/12CT (C40) | Special	751667067584	43.89	20	52.668	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	12
946	Djarum 10PKct/12CT (C40) | Vanilla / Ivory	751667090629	43.89	20	52.668	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	6
948	Dutch Master 4 For 5PK (C24) | Corona De Luxe	71610502314	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
949	Dutch Master 4 For 5PK (C24) | Corona Grape	071610503809	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
950	Dutch Master 4 For 5PK (C24) | Corona Sport Honey	071610502345	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
951	Dutch Master 4 For 5PK (C24) | Palma	071610502413	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	20
955	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Berry Fusion	071610341197	23.99	20	28.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	6
956	Dutch Master Fusion 2CT/$1.29 30CT (C12) | Honey Fusion	071610341210	23.99	20	28.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	6
958	Dutch Master Grape 3Pk 20CT (C16)	071610341609	32.5	20	39	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	4
959	Dutch Master President 5CT / 5PK	071610502376	21	20	25.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	30
1123	Game 2 For $1.29 30CT (C12) | Black Cherry	031700237960	21.99	20	26.388	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	14
967	Game 2 For $1.29 30CT (C12) | Black Sweets	031700238035	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	40
968	Game 2 For $1.29 30CT (C12) | Blue	031700237953	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	127
969	Game 2 For $1.29 30CT (C12) | Diamond	031700237991	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	61
970	Game 2 For $1.29 30CT (C12) | Espresso Martini	031700239377	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	6
971	Game 2 For $1.29 30CT (C12) | Green	031700237946	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	40
972	Game 2 For $1.29 30CT (C12) | Mvp White Russian	031700239414	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
973	Game 2 For $1.29 30CT (C12) | Natural Silver	031700238011	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	108
974	Game 2 For $1.29 30CT (C12) | Pineapple	031700238004	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	33
975	Game 2 For $1.29 30CT (C12) | Red Ruby	031700239100	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	16
976	Game 2 For $1.29 30CT (C12) | Summer Blend	031700239391	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	35
977	Game 2 For $1.29 30CT (C12) | White Grape	031700237922	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	52
978	Game 2 For $1.29 30CT (C12) | White Peach	031700237977	21.99	20	26.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	18
980	Game Leaf 2CT/$1.29 15CT (C24) | Tropical	031700238714	11.5	20	13.8	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	2
982	Game Mini 3CT/$1.29 15CT (C24) | Black Sweets	031700236864	11.99	20	14.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	48
983	Game Mini 3CT/$1.29 15CT (C24) | Blue	031700236628	11.99	20	14.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	29
984	Game Mini 3CT/$1.29 15CT (C24) | Diamond	031700236840	11.99	20	14.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	31
1125	Game Mini 3CT/$1.29 15CT (C24) | Red Sweets	031700236611	11.99	20	14.388	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	28
986	Good Times #Hd 3CT/$1.29 15CT (C24) | Berry Fusion	842426166867	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	25
1126	Good Times #Hd 3CT/$1.29 15CT (C24) | Blue	842426166898	9.75	20	11.7	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1127	Good Times #Hd 3CT/$1.29 15CT (C24) | Green Sweet	842426166959	9.75	20	11.7	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
1129	Good Times #Hd 3CT/$1.29 15CT (C24) | Kash	842426167017	9.75	20	11.7	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	25
989	Good Times #Hd 3CT/$1.29 15CT (C24) | Napa Grape	842426167048	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	2
990	Good Times #Hd 3CT/$1.29 15CT (C24) | Pure Silver	842426167079	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	27
991	Good Times #Hd 3CT/$1.29 15CT (C24) | Russian Cream	842426167130	9.75	20	11.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	26
993	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Natural	842426170642	12.25	20	14.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	4
994	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Russian Cream	842426170734	12.25	20	14.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	11
995	Good Times 2 For $1.39 Sweet Woods Leaf 15CT (C24) | Vanilla	842426170499	12.25	20	14.7	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	5
996	Good Times Black Smooth 69C 15CT (C25) | Mango	842426181686	5.25	20	6.3	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
997	Good Times Black Smooth 69C 15CT (C25) | Vanilla	842426181594	5.25	20	6.3	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
998	Good Times Black Smooth 69C 15CT (C25) | Watermelon	842426181563	5.25	20	6.3	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
1013	Phillies Titan 10CT/5PK (C12)	070235501412	41.99	20	50.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
1016	Pipe Tobacco Bag Ohm 16OZ (C24) | Blue	894945001426	9.49	20	11.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	20
1017	Pipe Tobacco Bag Ohm 16OZ (C24) | Menthol	894945001488	9.49	20	11.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	17
1018	Pipe Tobacco Bag Ohm 16OZ (C24) | Silver	894945001433	9.49	20	11.388	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	21
1030	Swisher Sweets 2CT/$1.19 30CT/2PK (C24) | Diamond	025900329839	20.89	20	25.068	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	25
1032	Swisher Sweets 2CT/$1.19 30CT/2PK (C24) | Regular Sweet	025900287337	20.89	20	25.068	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	135
1034	Swisher Sweets Blk 2CT/$1.49 15CT/2PK (C48) | Cocoa	025900336776	13.49	20	16.188	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
1036	Swisher Sweets Blk 2CT/$1.49 15CT/2PK (C48) | Smooth	025900325718	13.49	20	16.188	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	20
1037	Swisher Sweets Blk 2CT/$1.49 15CT/2PK (C48) | Wine	025900297695	13.49	20	16.188	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
1038	Swisher Sweets Blk 2CT/$1.49 30CT/2PK (C24) | Cherry	025900336882	24.99	20	29.988	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	27
1039	Swisher Sweets Leaf 2CT/$2.49 10CT/3PK (C20) | Aromatic	025900359522	14.5	20	17.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	33
1040	Swisher Sweets Leaf 2CT/$2.49 10CT/3PK (C20) | Brandy	025900359546	14.5	20	17.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	22
1042	Swisher Sweets Leaf 2CT/$2.49 10CT/3PK (C20) | Cream	025900359553	14.5	20	17.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	52
1041	Swisher Sweets Leaf 2CT/$2.49 10CT/3PK (C20) | Honey	025900359515	14.5	20	17.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	26
1043	Swisher Sweets Leaf 2CT/$2.49 10CT/3PK (C20) | Original	025900359508	14.5	20	17.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	45
1044	Swisher Sweets Mini Foil 3 For 2 15CT/3PK (C24) | Blue Berry	025900240868	15.25	20	18.3	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	2
1047	Tob American Club 16OZ (C20) | Classic	844504002968	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
1050	Tob Big Dog Broad Leaf Pp $1.99 20/2PK (C24) | Platinum Dark Leaf	817127028028	20	20	24	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
1052	Tob Big Dog Broad Leaf Pp $1.99 20/2PK (C24) | Vanilla	817127028011	20	20	24	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	5
1055	Tob L/L Big Duke 3OZ Pouches $1.99 (C12) | Regular	070195596602	15.99	20	19.188	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	64
1057	Tob L/L Bowie Pre-Priced $2.19 12CT (C12)	033300270521	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	50
1058	Tob L/L Chattanooga $2.19 12CT 3OZ (C12)	033300270538	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	44
1059	Tob L/L Chewing Tobacco Starr $2.19 Per Pouch 12CT (C12) | Peach	033300635870	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	30
1060	Tob L/L Chewing Tobacco Starr $2.19 Per Pouch 12CT (C12) | Regular	033300635849	18	20	21.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	71
1061	Tob L/L Lancaster B1G1 (C12)	033300632541	35.99	20	43.188	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	20
1063	Tob L/L Redman America'S Best Chew 6CT (C12) | Golden Blend	070195594196	46	20	55.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	34
1064	Tob L/L Redman America'S Best Chew 6CT (C12) | Original Blend	070195594202	46	20	55.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	57
1134	Tob L/L Redman America'S Best Chew 6CT (C12) | Silver Blend	070195594400	46	20	55.2	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	88
1066	Tob L/L Stoker 3OZ Pouches Supreme $1.99 (C12) Red	799953039327	16	20	19.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	160
1067	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Mango	860010326299	16	20	19.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	8
1068	Tob Lil Leaf  3/$2.99 10/3PK (C30) | Original	860010326268	16	20	19.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	13
1069	Tob Lil Leaf  3/$2.99 10/3PK (C30) | White Rum	850059190036	16	20	19.2	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	15
1070	Tob Longhorn Tub 14.4OZ 1CT (C8) | Finecut Natural	762446414000	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	74
1071	Tob Longhorn Tub 14.4OZ 1CT (C8) | Long Cut Mint	762446444007	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	40
1072	Tob Longhorn Tub 14.4OZ 1CT (C8) | Long Cut Natural	762446454006	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	46
1073	Tob Longhorn Tub 14.4OZ 1CT (C8) | Long Cut Straight	762446424009	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	28
1074	Tob Longhorn Tub 14.4OZ 1CT (C8) | Long Cut Wintergreen	762446404001	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	85
1075	Tob Loose Leaf Wrap 5/8PK 40CT (C40) | Sweet Aromatic	742978846173	22	20	26.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	2
1076	Tob Loose Leaf Wrap 5/8PK 40CT (C40) | Watermelon Dream	658238735616	22	20	26.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	2
1087	Tob Snuff Kayak 10CT Can (C18) | Long Cut Straight	033300616947	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	40
1089	Tob Snuff Navy Sweet Tc (C12)	033300518142	37	20	44.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	132
1090	Tob Snuff Peach Sweet 12CT (C12)	042100001266	182.99	20	219.588	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	7
1096	Tob Snuff Square Sweet Tc 1CT  (C12)	033300518203	37	20	44.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	172
1098	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Longcut Mint	799953221203	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	60
1099	Tob Snuff Stoker Tub 12OZ 1CT (C12) | Longcut Straight	799953231202	13.99	20	16.788	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	108
1137	Tob Snuff Superior Scotch Tc 1CT    (C12)	033300518241	37	20	44.4	72	\N	2025-10-31 00:57:25.872	2025-11-08 20:12:49.399	10	180
1105	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Blue	784762078513	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	3
1110	Tob Zig Zag Wrap Rillo 4F99 15CT (C24) | Pink	784762078612	9.5	20	11.4	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	5
1111	White Owl 2CT/$1.19 30CT/2PK (C12) | Platinum	031700237724	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	17
1112	White Owl 2CT/$1.19 30CT/2PK (C12) | Silver	031700237700	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	19
1113	White Owl 2CT/$1.19 30CT/2PK (C12) | Sweets	031700237694	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	19
1116	White Owl 2CT/$1.19 30CT/2PK (C12) | White Grape	031700237717	20.5	20	24.6	68	\N	2025-10-30 22:10:30.518	2025-11-08 20:12:49.399	10	6
\.


--
-- Data for Name: public_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.public_users (id, email, password, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation_items (id, "quotationId", "productId", name, "partNo", description, image, quantity, "unitPrice", "totalPrice", "createdAt") FROM stdin;
1	1	151	Tob Snuff Tops Sweet Tc Blue    (C12)	33300518302			1	44.4	44.4	2025-10-05 22:39:11.919
2	2	151	Tob Snuff Tops Sweet Tc Blue    (C12)	33300518302			1	0	0	2025-10-06 11:50:03.564
73	21	901	* ML Juul 4 Pod Strength 5% 8CT | Strength Virginia Tobacco	10819913011426		http://localhost:5000/uploads/images/1759663799368.webp?width=200&height=150&quality=70	2	122.4	244.8	2025-10-08 20:46:38.06
74	21	907	* ML Juul 4 Pod Strength 5% 8CT | Strength Classic Menthol	10819913012591		http://localhost:5000/uploads/images/1759605344250.webp?width=200&height=150&quality=70	2	122.4	244.8	2025-10-08 20:46:38.06
75	22	908	Test	8787		http://localhost:5000/uploads/images/1760964215652.webp?width=200&height=150&quality=70	1	12	12	2025-10-20 13:20:54.472
76	23	115	ss green	13000			1	12	12	2025-10-24 18:58:44.915
26	11	907	* ML Juul 4 Pod Strength 5% 8CT | Strength Classic Menthol	10819913012591		http://localhost:5000/uploads/images/1759605344250.webp?width=200&height=150&quality=70	4	122.4	489.6	2025-10-07 11:48:01.514
27	11	115	ss green	13000			1	12	12	2025-10-07 11:48:01.514
28	11	904	4 Kings 4 For $1.19 15CT (C24) | Mango	842426165396			1	10.38	10.38	2025-10-07 11:48:01.514
29	11	156	winston	76149276			2	3	6	2025-10-07 11:48:01.514
40	12	901	* ML Juul 4 Pod Strength 5% 8CT | Strength Virginia Tobacco	10819913011426		http://localhost:5000/uploads/images/1759663799368.webp?width=200&height=150&quality=70	1	122.4	122.4	2025-10-07 20:53:22.505
41	12	902	4 Kings 4 For $1.19 15CT (C24) | Blueberry Pineapple	842426165242			2	10.38	20.76	2025-10-07 20:53:22.505
42	12	162	ss red	11000			1	12	12	2025-10-07 20:53:22.505
43	12	22	123123				1	0	0	2025-10-07 20:53:22.505
44	12	19	snuf very large	9797			2	54	108	2025-10-07 20:53:22.505
61	15	901	* ML Juul 4 Pod Strength 5% 8CT | Strength Virginia Tobacco	10819913011426		http://localhost:5000/uploads/images/1759663799368.webp?width=200&height=150&quality=70	2	122.4	244.8	2025-10-08 19:41:19.573
62	15	907	* ML Juul 4 Pod Strength 5% 8CT | Strength Classic Menthol	10819913012591		http://localhost:5000/uploads/images/1759605344250.webp?width=200&height=150&quality=70	2	122.4	244.8	2025-10-08 19:41:19.573
63	15	\N	Chayane				5	2.25	11.25	2025-10-08 19:41:19.573
\.


--
-- Data for Name: quotation_order_conversions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation_order_conversions (id, "quotationId", "orderId", "orderNumber", "convertedAt") FROM stdin;
1	21	50	SaleOrder-QT-0006-REV1-M-20251010	2025-10-10 22:51:47.227
2	23	52	SaleOrder-QT-0008-J-20251024	2025-10-24 19:00:52.686
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotations (id, "quotationId", "customerName", "customerEmail", "customerPhone", "offerDate", "validUntil", notes, subtotal, "taxRate", "taxAmount", total, status, "createdById", "sentAt", "viewedAt", "acceptedAt", "createdAt", "updatedAt", "customerId") FROM stdin;
1	QT-0001	Unknown Customer	unknown@example.com		2025-10-05 00:00:00	2025-11-04 00:00:00		44.4	0	0	44.4	SENT	1	2025-10-05 22:46:44.979	\N	\N	2025-10-05 22:39:11.919	2025-10-05 22:46:44.981	\N
22	QT-0007	nafez	nafez@gmail.com	+1456456456456	2025-10-20 00:00:00	2025-11-19 00:00:00		12	0	0	12	SENT	1	2025-10-20 13:21:06.826	\N	\N	2025-10-20 13:20:54.472	2025-10-20 13:21:06.828	\N
2	QT-0002	Unknown Customer	unknown@example.com		2025-10-05 00:00:00	2025-11-04 00:00:00		44.4	0	0	44.4	SENT	1	2025-10-06 22:43:01.943	\N	\N	2025-10-06 11:50:03.564	2025-10-06 22:43:01.944	\N
11	QT-0003	jehad	kjhkjh@gakklj.com	+321321321	2025-10-07 00:00:00	2025-11-06 00:00:00		517.98	0	0	150.78	DRAFT	1	\N	\N	\N	2025-10-07 11:46:57.494	2025-10-07 11:48:01.514	\N
12	QT-0004	nafez	nafez@gmail.com	+1456456456456	2025-10-07 00:00:00	2025-11-06 00:00:00	hi	263.16	0	0	263.16	DRAFT	1	\N	\N	\N	2025-10-07 20:52:45.69	2025-10-07 20:53:22.505	\N
23	QT-0008	Jameel	jameel@yahoo.com	+123123123	2025-10-24 00:00:00	2025-11-23 00:00:00		12	0	0	12	ACCEPTED	1	\N	\N	2025-10-24 19:00:52.694	2025-10-24 18:58:44.915	2025-10-24 19:00:52.696	\N
15	QT-0006	Moh	moh@gmail.com	+321321	2025-10-08 00:00:00	2025-11-07 00:00:00	please find here under oyr offer hello	500.85	10	50.08500000000001	550.9350000000001	SENT	1	2025-10-08 16:07:14.249	\N	\N	2025-10-08 16:06:04.046	2025-10-08 19:41:19.573	\N
21	QT-0006-REV1	Moh	moh@gmail.com	+321321	2025-10-08 00:00:00	2025-11-07 00:00:00	please find here under oyr offer hello MARHABA 	489.6	10	48.96000000000001	538.5600000000001	ACCEPTED	1	2025-10-09 01:12:26.735	\N	2025-10-10 22:51:47.236	2025-10-08 20:46:38.06	2025-10-10 22:51:47.248	\N
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact, email, phone, address, "createdAt", "updatedAt") FROM stdin;
1	Star Imports	Mounty				2025-08-29 00:52:58.559	2025-08-29 00:52:58.559
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, company, role, "createdAt", "updatedAt", address, gps, tel) FROM stdin;
1	admin@alwaleed.com	$2b$10$0MMkxwKn.OlpJWh6XBg.VebD/rsE1jcF0KBqzyMRO36K7uFKImbgi	Admin User	Al-Waleed Inc	ADMIN	2025-08-23 00:49:03.65	2025-08-23 00:49:03.65	\N	\N	\N
3	waddah@gmail.com	$2b$10$p.dkYkYigXTVHnK2VckVwOzEoXKynd2Vw.itzVDAHHPub7BjPN.xi	Waddah	Waddah inc	CLIENT	2025-08-24 17:16:09.102	2025-09-03 12:26:09.881	\N	\N	\N
5	nazek@gmail.com	$2b$10$nft4Qyi.OGQ8tAClaxzdPuz/jQWCq1Iv7AnWTwmmc6D5oato5uCri	NAZEK	al-waleed	CLIENT	2025-09-03 00:43:50.713	2025-09-03 17:03:31.438	jobeiha	check whats app	079995555000
6	roni@gmail.com	$2b$12$bstvrGnBB8Cb2NVMn2aDK.jZCn9.jQ1HN9KTO3/xdPPS.eJNtnEEy	Roni	GCC	CLIENT	2025-11-17 23:44:19.113	2025-11-17 23:44:19.113	\N	\N	\N
2	client1@alwaleed.com	$2b$12$nXeR6Y7GWg5FFP54X46SnekB21jX2fHxXWwwIxuUOY0OY4C74O/Ti	Client One	Client Company 1	ADMIN	2025-08-23 00:56:36.517	2025-11-17 23:46:08.808	-	-	-
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 74, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: inbound_invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inbound_invoice_items_id_seq', 1, false);


--
-- Name: inbound_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inbound_invoices_id_seq', 1, false);


--
-- Name: inbound_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inbound_order_items_id_seq', 201, true);


--
-- Name: inbound_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inbound_orders_id_seq', 58, true);


--
-- Name: order_controls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_controls_id_seq', 100, true);


--
-- Name: outbound_invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outbound_invoice_items_id_seq', 19, true);


--
-- Name: outbound_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outbound_invoices_id_seq', 13, true);


--
-- Name: outbound_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outbound_order_items_id_seq', 1, false);


--
-- Name: outbound_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outbound_orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 1256, true);


--
-- Name: public_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.public_users_id_seq', 1, false);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_items_id_seq', 76, true);


--
-- Name: quotation_order_conversions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_order_conversions_id_seq', 2, true);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotations_id_seq', 23, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: inbound_invoice_items inbound_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoice_items
    ADD CONSTRAINT inbound_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: inbound_invoices inbound_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoices
    ADD CONSTRAINT inbound_invoices_pkey PRIMARY KEY (id);


--
-- Name: inbound_order_items inbound_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_order_items
    ADD CONSTRAINT inbound_order_items_pkey PRIMARY KEY (id);


--
-- Name: inbound_orders inbound_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_orders
    ADD CONSTRAINT inbound_orders_pkey PRIMARY KEY (id);


--
-- Name: order_controls order_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_controls
    ADD CONSTRAINT order_controls_pkey PRIMARY KEY (id);


--
-- Name: outbound_invoice_items outbound_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoice_items
    ADD CONSTRAINT outbound_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: outbound_invoices outbound_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoices
    ADD CONSTRAINT outbound_invoices_pkey PRIMARY KEY (id);


--
-- Name: outbound_order_items outbound_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_order_items
    ADD CONSTRAINT outbound_order_items_pkey PRIMARY KEY (id);


--
-- Name: outbound_orders outbound_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_orders
    ADD CONSTRAINT outbound_orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: public_users public_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_users
    ADD CONSTRAINT public_users_pkey PRIMARY KEY (id);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- Name: quotation_order_conversions quotation_order_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_order_conversions
    ADD CONSTRAINT quotation_order_conversions_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: inbound_invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "inbound_invoices_invoiceNumber_key" ON public.inbound_invoices USING btree ("invoiceNumber");


--
-- Name: inbound_orders_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "inbound_orders_orderNumber_key" ON public.inbound_orders USING btree ("orderNumber");


--
-- Name: order_controls_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "order_controls_userId_key" ON public.order_controls USING btree ("userId");


--
-- Name: outbound_invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "outbound_invoices_invoiceNumber_key" ON public.outbound_invoices USING btree ("invoiceNumber");


--
-- Name: outbound_orders_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "outbound_orders_orderNumber_key" ON public.outbound_orders USING btree ("orderNumber");


--
-- Name: products_partNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "products_partNo_key" ON public.products USING btree ("partNo");


--
-- Name: public_users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX public_users_email_key ON public.public_users USING btree (email);


--
-- Name: quotations_quotationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "quotations_quotationId_key" ON public.quotations USING btree ("quotationId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbound_invoice_items inbound_invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoice_items
    ADD CONSTRAINT "inbound_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.inbound_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbound_invoice_items inbound_invoice_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoice_items
    ADD CONSTRAINT "inbound_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inbound_invoices inbound_invoices_outboundOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoices
    ADD CONSTRAINT "inbound_invoices_outboundOrderId_fkey" FOREIGN KEY ("outboundOrderId") REFERENCES public.outbound_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbound_invoices inbound_invoices_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_invoices
    ADD CONSTRAINT "inbound_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbound_order_items inbound_order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_order_items
    ADD CONSTRAINT "inbound_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.inbound_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbound_order_items inbound_order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_order_items
    ADD CONSTRAINT "inbound_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inbound_orders inbound_orders_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_orders
    ADD CONSTRAINT "inbound_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inbound_orders inbound_orders_outboundOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbound_orders
    ADD CONSTRAINT "inbound_orders_outboundOrderId_fkey" FOREIGN KEY ("outboundOrderId") REFERENCES public.outbound_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_controls order_controls_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_controls
    ADD CONSTRAINT "order_controls_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_invoice_items outbound_invoice_items_inboundItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoice_items
    ADD CONSTRAINT "outbound_invoice_items_inboundItemId_fkey" FOREIGN KEY ("inboundItemId") REFERENCES public.inbound_invoice_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: outbound_invoice_items outbound_invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoice_items
    ADD CONSTRAINT "outbound_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.outbound_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_invoice_items outbound_invoice_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoice_items
    ADD CONSTRAINT "outbound_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: outbound_invoices outbound_invoices_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoices
    ADD CONSTRAINT "outbound_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_invoices outbound_invoices_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoices
    ADD CONSTRAINT "outbound_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_invoices outbound_invoices_inboundInvoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_invoices
    ADD CONSTRAINT "outbound_invoices_inboundInvoiceId_fkey" FOREIGN KEY ("inboundInvoiceId") REFERENCES public.inbound_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_order_items outbound_order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_order_items
    ADD CONSTRAINT "outbound_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.outbound_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_order_items outbound_order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_order_items
    ADD CONSTRAINT "outbound_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: outbound_orders outbound_orders_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_orders
    ADD CONSTRAINT "outbound_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: outbound_orders outbound_orders_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_orders
    ADD CONSTRAINT "outbound_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotation_items quotation_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT "quotation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotation_items quotation_items_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quotation_order_conversions quotation_order_conversions_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_order_conversions
    ADD CONSTRAINT "quotation_order_conversions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.inbound_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotation_order_conversions quotation_order_conversions_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_order_conversions
    ADD CONSTRAINT "quotation_order_conversions_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public.quotations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotations quotations_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 6uTLzPFa6oaEdWuNca6bYwprKXedhaVbRpyiBOopErF9FeJE5ZKveswlWPH149a

