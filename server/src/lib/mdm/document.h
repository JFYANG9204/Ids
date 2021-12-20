#include <vector>


using namespace std;

template<class T>
class MdmCollection {
public:
    MdmCollection()
    {
        m_deleted = new vector<T>();
        m_values = new vector<T>();
    }
    ~MdmCollection()
    {
        delete m_values;
        delete m_deleted;
    }

    T operator [] (size_t index)
    {
        if (index < m_values->size()) {
            return (*m_values)[index];
        }
        return NULL;
    };

    void PushDeleted(T item)
    {
        this->m_deleted->push_back(item);
    }

    void Push(T item)
    {
        this->m_values->push_back(item);
    }

    vector<T>* GetValues()
    {
        return m_values;
    }

    vector<T>* GetDeleted()
    {
        return m_deleted;
    }

private:
    vector<T>* m_values;
    vector<T>* m_deleted;
};


struct Property
{
    Property(char* name, char* value, char* type, char* context, char* ds = NULL, char* styles = NULL)
    {
        Name = name;
        Value = value;
        Type = type;
        Context = context;
        Ds = ds;
        Styles = styles;
    }

    char* Name;
    char* Value;
    char* Type;
    char* Context;
    char* Ds;
    char* Styles;
};

const Property EMPTY_PROPERTY = Property(NULL, NULL, NULL, NULL);

class Properties
{
public:
    Properties() {}
    ~Properties() {}

    void PushUnversioned(Property prop)
    {
        m_unversioned->push_back(prop);
    }
    void Push(Property prop)
    {
        m_values->push_back(prop);
    }

    Property operator[] (size_t index)
    {
        if (index < m_values->size())
        {
            return (*m_values)[index];
        }
        return EMPTY_PROPERTY;
    }

private:
    vector<Property>* m_unversioned;
    vector<Property>* m_values;
};

struct NativeValue
{
    char* FullName;
    char* Value;
};

struct SubAlias
{
    char* Index;
    char* Name;
};

struct MDMRange
{
    char* EffectiveMaxValue;
    char* EffectiveMinValue;
    char* MinValue;
    char* MaxValue;
    char* MinType;
    char* MaxType;
};

struct AliasVariable
{
    char* FullName;
    char* AliasName;
    vector<NativeValue>* NativeValues;
    vector<SubAlias>* SubAlias;
    Properties* Properties;
};

struct RoutingItem
{
    char* Name;
    char* Item;
};

struct Routing
{
    char* Context;
    char* InterviewModes;
    char* UseKeyCodes;
    vector<RoutingItem>* ritem;
};

struct VarInstance
{
    char* Name;
    char* SourceType;
    char* Variable;
    char* FullName;
};

struct Reference
{
    char* Id;
    char* Name;
    char* Ref;
};

struct Label
{
    char* Context;
    char* Language;
    char* Text;
};

struct Labels
{
    char* Context;
    vector<Label>* Values;
};

struct Script
{
    char* Name;
    char* Default;
    char* Text;
};

struct ScriptType
{
    MdmCollection<Script>* Collection;
    char* Type;
    char* Context;
    char* InterviewModes;
    char* UseKeycodes;
};

struct Routings
{
    char* Name;
    MdmCollection<Script>* Scripts;
    vector<Routing>* Items;
};


class MdmDocument
{
public:
    MdmDocument() {}
    ~MdmDocument() {}


    inline Properties* GetProperties()          { return m_properties; }
    inline MdmCollection<Property>* GetStyles() { return m_styles; }

private:
    char* m_mdmcreateversion;
    char* m_mdmlastversion;
    char* m_id;
    char* m_dataversion;
    char* m_datasubversion;
    char* m_systemvariable;
    char* m_dbfiltervalidataion;
    char* m_xmlns;
    Properties* m_properties;
    MdmCollection<Property>* m_styles;


};

