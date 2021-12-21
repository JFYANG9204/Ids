#pragma once

#include <vector>

using namespace std;

template<typename T>
void FreeVector(vector<T>* v);

template<typename T>
struct MdmCollection
{
    MdmCollection() : MdmCollection(nullptr) {}
    MdmCollection<T>(vector<T>* values, vector<T>* deleted = nullptr)
    {
        Values = values;
        Deleted = deleted;
    }
    virtual ~MdmCollection()
    {
        if (Deleted) FreeVector(Deleted);
        if (Values)  FreeVector(Values);
    }
    vector<T>* Deleted;
    vector<T>* Values;

    void PushItem(T* item, bool isDeleted = false)
    {
        if (isDeleted)
        {
            Deleted->push_back(item);
        }
        else
        {
            Values->push_back(item);
        }
    }
};

struct Property
{
    Property() : Property(nullptr, nullptr, nullptr, nullptr) {}
    Property(char* name, char* value, char* type, char* context, char* ds = nullptr)
    {
        Name = name;
        Value = value;
        Type = type;
        Context = context;
        Ds = ds;
        Styles = nullptr;
    }
    ~Property()
    {
        if (Styles) delete Styles;
    }
    char* Name;
    char* Value;
    char* Type;
    char* Context;
    char* Ds;
    MdmCollection<Property*>* Styles;
};

struct Properties
{
    Properties() : Properties(nullptr, nullptr) {}
    Properties(MdmCollection<Property*>* unversioned, MdmCollection<Property*>* values)
    {
        Unversioned = unversioned;
        Values = values;
    }
    ~Properties()
    {
        if (Unversioned) delete Unversioned;
        if (Values)      delete Values;
    }
    MdmCollection<Property*>* Unversioned;
    MdmCollection<Property*>* Values;
};

struct Labels
{
    struct Label
    {
        char* Context;
        char* Language;
        char* Text;
    };

    Labels() : Labels(nullptr) {}
    Labels(char* context, vector<Label*>* values = nullptr)
    {
        Context = context;
        Values = values;
    }
    ~Labels()
    {
        if (Values) FreeVector(Values);
    }

    char* Context;
    vector<Label*>* Values;
};

typedef Properties Notes;
typedef Properties LabelStyles;
typedef MdmCollection<Property> Styles;


struct Script
{
    char* Name;
    char* Default;
    char* Text;
};

struct ScriptType : public MdmCollection<Script*>
{
    ScriptType() : ScriptType(nullptr, nullptr, nullptr, nullptr) {}
    ScriptType(char* type, char* context, char* interviewModes, char* useKeycodes) : MdmCollection()
    {
        Type = type;
        Context = context;
        InterviewModes = interviewModes;
        UseKeycodes = useKeycodes;
    }
    ~ScriptType() {}
    char* Type;
    char* Context;
    char* InterviewModes;
    char* UseKeycodes;
};

typedef MdmCollection<ScriptType*> Scripts;

struct MdmRange
{
    MdmRange() : MdmRange(nullptr, nullptr, nullptr, nullptr) {}
    MdmRange(char* min, char* minType, char* max, char* maxType, char* effMin = nullptr, char* effMax = nullptr)
    {
        MinValue = min;
        MinType = minType;
        MaxValue = max;
        MaxType = maxType;
        EffectiveMaxValue = effMax;
        EffectiveMinValue = effMin;
    }
    char* EffectiveMaxValue;
    char* EffectiveMinValue;
    char* MinValue;
    char* MaxValue;
    char* MinType;
    char* MaxType;
};

struct AliasVariable : public MdmRange
{
    AliasVariable(): AliasVariable(nullptr, nullptr, nullptr) {}
    AliasVariable(char* fullName, char* aliasName, Properties* props): MdmRange()
    {
        FullName = fullName;
        AliasName = aliasName;
        NativeValues = nullptr;
        Properties = props;
    }
    ~AliasVariable()
    {
        if (NativeValues) FreeVector(NativeValues);
        if (SubAlias)     FreeVector(SubAlias);
        if (Properties)   delete Properties;
    }

    char* FullName;
    char* AliasName;

    struct _NativeValue_
    {
        _NativeValue_(char* fullName, char* value)
        {
            FullName = fullName;
            Value = value;
        }
        char* FullName;
        char* Value;
    };

    vector<_NativeValue_*>* NativeValues;

    struct _SubAlias_
    {
        _SubAlias_(char* index, char* name)
        {
            Index = index;
            Name = name;
        }
        char* Index;
        char* Name;
    };

    vector<_SubAlias_*>* SubAlias;
    ::Properties* Properties;

    void PushNativeValues(char* fullName, char* value)
    {
        if (!NativeValues)
        {
            NativeValues = new vector<_NativeValue_*>();
        }
        NativeValues->push_back(new _NativeValue_(fullName, value));
    }

    void PushSubAlias(char* index, char* name)
    {
        if (!SubAlias)
        {
            SubAlias = new vector<_SubAlias_*>();
        }
        SubAlias->push_back(new _SubAlias_(index, name));
    }
};

struct Routing
{
    Routing(char* context, char* interviewModes, char* useKeyCodes)
    {
        Context = context;
        InterviewModes =interviewModes;
        UseKeyCodes = useKeyCodes;
        RItems = nullptr;
    }

    ~Routing()
    {
        if (RItems) FreeVector(RItems);
    }

    struct RoutingItem
    {
        RoutingItem(char* name, char* item)
        {
            Name = name;
            Item = item;
        }
        char* Name;
        char* Item;
    };

    char* Context;
    char* InterviewModes;
    char* UseKeyCodes;
    vector<RoutingItem*>* RItems;

    void Push(char* name, char* item)
    {
        if (!RItems)
        {
            RItems = new vector<RoutingItem*>();
        }
        RItems->push_back(new RoutingItem(name, item));
    }

};

struct Routings
{
    Routings(char* name = nullptr)
    {
        Name = name;
        Scripts = nullptr;
        RItems = nullptr;
    }

    ~Routings()
    {
        if (Scripts) delete Scripts;
        if (RItems)  delete RItems;
    }

    char* Name;
    ::Scripts* Scripts;
    vector<Routing*>* RItems;
};


struct VarInstance
{
    VarInstance(char* name, char* sourceType, char* variable, char* fullName)
    {
        Name = name;
        SourceType = sourceType;
        Variable = variable;
        FullName = fullName;
    }
    char* Name;
    char* SourceType;
    char* Variable;
    char* FullName;
};

struct Reference
{
    Reference(char* id, char* name, char* ref)
    {
        Id = id, Name = name, Ref = ref;
    }
    char* Id;
    char* Name;
    char* Ref;
};

struct Category
{
    Category(): Category(nullptr, nullptr) {}

    Category(char* id, char* name)
    {
        Id            = id;
        Name          = name;
        Fixed         = nullptr;
        NoFilter      = nullptr;
        Missing       = nullptr;
        Exclusive     = nullptr;
        OtherLocal    = nullptr;
        Properties    = nullptr;
        Templates     = nullptr;
        Labels        = nullptr;
        LabelStyles   = nullptr;
        OtherVariable = nullptr;
        Notes         = nullptr;
    }

    ~Category()
    {
        if (Properties)    delete Properties;
        if (Templates)     delete Templates;
        if (Labels)        delete Labels;
        if (LabelStyles)   delete LabelStyles;
        if (OtherVariable) delete OtherVariable;
        if (Notes)         delete Notes;
    }

    char* Id;
    char* Name;
    char* Fixed;
    char* NoFilter;
    char* Missing;
    char* Exclusive;
    char* OtherLocal;
    ::Properties* Properties;
    ::Properties* Templates;
    ::Labels* Labels;
    ::LabelStyles* LabelStyles;
    ::Reference* OtherVariable;
    ::Notes* Notes;
};

struct Categories : public MdmCollection<Category*>
{
    Categories() : Categories(nullptr, nullptr, nullptr) {}

    Categories(char* id, char* name, char* globalNs): MdmCollection()
    {
        Id = id;
        Name = name;
        GlobalNamespace = globalNs;
        Labels = nullptr;
        SubCategories = nullptr;
        Elements = nullptr;
        Properties = nullptr;
        Templates = nullptr;
    }

    ~Categories()
    {
        if (Elements)       FreeVector(Elements);
        if (SubCategories)  delete SubCategories;
        if (Labels)         delete Labels;
        if (Properties)     delete Properties;
        if (Templates)      delete Templates;
    }

    char* Id;
    char* Name;
    char* GlobalNamespace;
    ::Labels* Labels;
    ::Categories* SubCategories;

    struct Element {
        Element(char* id, char* name, char* type, ::Labels* labels)
        {
            Id = id;
            Name = name;
            Type = type;
            Labels = labels;
        }
        char* Id;
        char* Name;
        char* Type;
        ::Labels* Labels;
    };

    vector<Element*>* Elements;
    ::Properties* Properties;
    ::Properties* Templates;

    void PushElement(char* id, char* name, char* type, ::Labels* labels)
    {
        if (!Elements)
        {
            Elements = new vector<Element*>();
        }
        Elements->push_back(new Element(id, name, type, labels));
    }

};

struct MdmField;
struct MdmBlockField;
struct MdmLoopField;

enum MdmFieldType
{
    MDM_REFERENCE  = 0,
    MDM_BLOCKFIELD = 1,
    MDM_LOOPFIELD  = 2
};

struct MdmField
{
    MdmField(void* value, MdmFieldType type)
    {
        Value = value;
        Type = type;
    }

    ~MdmField()
    {
        if (Value) delete Value;
    }

    MdmFieldType Type;
    void* Value;

};

struct MdmFieldBase
{

    MdmFieldBase(char* name)
    {
        Name = name;
    }

    virtual ~MdmFieldBase()
    {
        if (Properties) delete Properties;
        if (Templates)  delete Templates;
        if (Labels)     delete Labels;
    }

    char* Name;
    ::Properties* Properties;
    ::Properties* Templates;
    ::Labels* Labels;
};


struct MdmBlockSubField : public MdmCollection<MdmFieldType*>
{
    MdmBlockSubField(char* name, char* globalNs): MdmCollection()
    {
        Name = name;
        GlobalNamespace = globalNs;
    }
    char* Name;
    char* GlobalNamespace;
};

struct MdmBlockField : public MdmFieldBase
{
    char* Id;
    char* GlobalNamespace;
    ::Reference* Types;
    ::MdmBlockSubField* Fields;
};


