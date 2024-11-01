To implement a feature where you display a list of employees, and when a button beside an employee's name is clicked, it fetches the department details of that particular employee, we can use Blazor's event handling and state management concepts.

    Here's how we can break it down:

Steps:
Modify the State to Track Individual Employee Data: We'll store department information in the EmployeeState as a property of the individual employee.
Handle Button Click to Fetch Department Info: The button click will trigger an action to fetch the department info for the clicked employee.
Update the UI Dynamically: After fetching the department info, update the UI to display it next to the employee's name.
Solution:
1. Modify EmployeeState to Include Department Info
Each EmployeeWithDepartmentDTO should hold the department information that will be populated when the department is fetched.

    csharp
Copy code
[FeatureState]
public record EmployeeState
{
    public static readonly EmployeeState Empty = new ();

    public List < EmployeeWithDepartmentDTO > Employees { get; init; }

    public bool IsLoading { get; init; }

    public string ErrorMessage { get; init; }
}

public record EmployeeWithDepartmentDTO
{
    public Employee Employee { get; init; }
    public string DepartmentName { get; init; } = string.Empty; // Default to empty
}
2. Action to Fetch Department for Specific Employee
We'll define a specific action to fetch the department details for a particular employee based on their EmpId.

csharp
Copy code
public record FetchDepartmentForEmployeeAction(Guid EmpId);
public record DepartmentFetchedForEmployeeAction(Guid EmpId, string DepartmentName);
3. Reducer to Update State After Department is Fetched
When the department is fetched, we'll update the specific employee's department information in the state.

    csharp
Copy code
public static class EmployeeReducers {
    [ReducerMethod]
    public static EmployeeState OnDepartmentFetched(EmployeeState state, DepartmentFetchedForEmployeeAction action) {
        // Update the specific employee's department name
        var updatedEmployees = state.Employees.Select(empDto => {
            if (empDto.Employee.EmpId == action.EmpId) {
                return empDto with { DepartmentName = action.DepartmentName };
            }
            return empDto;
        }).ToList();

        return state with { Employees = updatedEmployees };
    }
}
4. Effect to Fetch Department from the API
We’ll need an effect to fetch the department information for a specific employee.This effect will be triggered by the FetchDepartmentForEmployeeAction.

    csharp
Copy code
public class EmployeeEffects {
    private readonly IDepartmentService _departmentService;

    public EmployeeEffects(IDepartmentService departmentService) {
        _departmentService = departmentService;
    }

    [EffectMethod]
    public async Task HandleFetchDepartmentForEmployee(FetchDepartmentForEmployeeAction action, IDispatcher dispatcher) {
        try {
            // Fetch the department details for the employee
            var department = await _departmentService.GetDepartmentByEmployeeIdAsync(action.EmpId);
            dispatcher.Dispatch(new DepartmentFetchedForEmployeeAction(action.EmpId, department.DepartmentName));
        }
        catch (Exception ex)
        {
            // Handle error, you can dispatch an error action here if necessary
        }
    }
}
5. Blazor UI to Display the Employees and Handle the Button Click
In your Blazor component, you will render the list of employees.Each employee will have a button beside their name that, when clicked, fetches the department information for that employee.

    razor
Copy code
@inject IDispatcher Dispatcher
@inject IState < EmployeeState > EmployeeState

    < div >
    <h3>Employees </h3>
    <ul>
@foreach(var employeeDto in EmployeeState.Value.Employees)
{
    <li>
        @employeeDto.Employee.Name
        @if (!string.IsNullOrEmpty(employeeDto.DepartmentName)) {
            <span>- @employeeDto.DepartmentName </span>
        }
    <button @onclick="() => FetchDepartment(employeeDto.Employee.EmpId)" > Get Department </button>
        </li>
}
</ul>
    </div>

@code {
    private void FetchDepartment(Guid empId)
    {
        // Dispatch the action to fetch department for the specific employee
        Dispatcher.Dispatch(new FetchDepartmentForEmployeeAction(empId));
    }
}
Explanation of the UI:
For each employee in the list, we show the employee's name.
If the employee's department name has been fetched (i.e., DepartmentName is not empty), it is displayed beside the name.
There's a button beside each employee to trigger the fetching of the department details for that specific employee.
6. Mocking the IDepartmentService for Testing
For testing purposes, here's a simple mock implementation of IDepartmentService that returns department details based on EmpId.

csharp
Copy code
public class DepartmentService : IDepartmentService
{
    private readonly List < Department > _departments = new ()
    {
        new Department { EmpId = Guid.Parse("..."), DepartmentName = "HR" },
        new Department { EmpId = Guid.Parse("..."), DepartmentName = "IT" },
        new Department { EmpId = Guid.Parse("..."), DepartmentName = "Finance" }
    };

    public Task < Department > GetDepartmentByEmployeeIdAsync(Guid empId)
    {
        var department = _departments.FirstOrDefault(d => d.EmpId == empId);
        return Task.FromResult(department);
    }
}
Summary of the Approach:
State: We store employees and their departments in the EmployeeState.
    Action: We trigger an action when the "Get Department" button is clicked to fetch department details for the specific employee.
        Reducer: The state is updated with the fetched department information once the API call succeeds.
            Effect: The API call is handled in an effect and dispatched back to the store.
This approach provides a clean and modular way to handle the fetching and displaying of department data for each individual employee using Blazor's state management concepts.


public static IQueryable < TResult > GroupByWithAggregates<TModel, TResult>(
                this IQueryable < TModel > query,
                List < ColumnEnum > groupByColumns,
                Expression < Func < TModel, int >> sumColumn,
                Expression < Func < TModel, int >> distinctIdColumn,
                int minTotalAmount, // New parameter for minimum TotalAmount
                Expression < Func < IGrouping<object, TModel>, TResult >> resultSelector)
    where TModel: Entity
{
    // Group by conditions based on hard-coded columns
    IQueryable < IGrouping < object, TModel >> groupedQuery = query;

    foreach(var column in groupByColumns)
    {
        groupedQuery = column switch
        {
            ColumnEnum.OrderId => groupedQuery.GroupBy(e => e.OrderId),
            ColumnEnum.Item => groupedQuery.GroupBy(e => e.Item),
            ColumnEnum.Amount => groupedQuery.GroupBy(e => e.Amount),
            ColumnEnum.CustomerId => groupedQuery.GroupBy(e => e.CustomerId),
            _ => throw new ArgumentException("Invalid column for grouping")
        } as IQueryable<IGrouping<object, TModel>>;
        }

        // Summing and distinct count aggregations with TotalAmount filter
        var aggregatedQuery = groupedQuery.Select(group => new
            {
                GroupKey = group.Key,
                TotalAmount = group.Sum(sumColumn.Compile()),
                DistinctCustomerCount = group.Select(distinctIdColumn.Compile()).Distinct().Count()
            })
            .Where(g => g.TotalAmount > minTotalAmount); // Filter by minTotalAmount

        return aggregatedQuery.Select(resultSelector);
    }


    ------------------------

        public static IQueryable < IGrouping < TKey, T >> GroupBy<T, TKey>(
            this IQueryable < T > source,
            string keySelector)
    {
        var keyExpression = BuildLambdaExpression<T, TKey>(keySelector);
        return source.GroupBy((Expression<Func<T, TKey>>)keyExpression);
    }
    
    public static IQueryable < IGrouping < TKey, T >> WhereAggregate<T, TKey, TAggregate>(
        this IQueryable < IGrouping < TKey, T >> source,
        string aggregateFunction,
        Expression < Func < IGrouping<TKey, T>, TAggregate >> aggregateSelector,
        Func < TAggregate, bool > condition)
    {
        // Apply aggregate function and filter condition
        switch (aggregateFunction.ToLower()) {
            case "sum":
                return source.Where(group => condition(group.Sum(aggregateSelector)));
            case "count":
                return source.Where(group => condition(group.Count()));
            case "max":
                return source.Where(group => condition(group.Max(aggregateSelector)));
            case "min":
                return source.Where(group => condition(group.Min(aggregateSelector)));
            case "average":
                return source.Where(group => condition(group.Average(aggregateSelector)));
            default:
                throw new ArgumentException("Invalid aggregate function");
        }
    }
    
    private static Expression < Func < T, TKey >> BuildLambdaExpression<T, TKey>(string property)
    {
        ParameterExpression parameter = Expression.Parameter(typeof (T), "x");
        Expression propertyAccess = property.Split('.')
            .Aggregate((Expression)parameter, (acc, propName) =>
                Expression.PropertyOrField(acc, propName));

        return Expression.Lambda<Func<T, TKey>>(propertyAccess, parameter);
    }





    public static IQueryable < IGrouping < TKey, T >> WhereAggregate<T, TKey>(
        this IQueryable < IGrouping < TKey, T >> source,
        string aggregateFunction,
        string propertyName,
        string comparisonOperator,
        double threshold)
    {
        // Build the lambda expression for the property dynamically
        var propertySelector = BuildLambdaExpression<T>(propertyName, out var propertyType);

        // Compile the lambda expression
        var compiledSelector = propertySelector.Compile();

        // Define the comparison based on the operator
        Func < double, bool > condition = comparisonOperator switch
        {
            ">" => value => value > threshold,
            "<" => value => value < threshold,
            ">=" => value => value >= threshold,
            "<=" => value => value <= threshold,
            "==" => value => value == threshold,
            "!=" => value => value != threshold,
            _ => throw new ArgumentException("Invalid comparison operator")
        };

        // Apply the aggregate function and the defined condition
        switch (aggregateFunction.ToLower()) {
            case "sum":
                return source.Where(group => condition(Convert.ToDouble(group.Select(compiledSelector).Sum(x => Convert.ChangeType(x, typeof (double))))));
            case "average":
                return source.Where(group => condition(Convert.ToDouble(group.Select(compiledSelector).Average(x => Convert.ChangeType(x, typeof (double))))));
            case "count":
                return source.Where(group => condition(group.Count()));
            case "max":
                return source.Where(group => condition(Convert.ToDouble(group.Max(compiledSelector))));
            case "min":
                return source.Where(group => condition(Convert.ToDouble(group.Min(compiledSelector))));
            default:
                throw new ArgumentException("Invalid aggregate function");
        }
    }
    
    private static LambdaExpression BuildLambdaExpression<T>(string propertyName, out Type propertyType)
    {
        var parameter = Expression.Parameter(typeof (T), "x");
        Expression propertyAccess = parameter;

        foreach(var member in propertyName.Split('.'))
        {
            propertyAccess = Expression.PropertyOrField(propertyAccess, member);
        }

        // Get the type of the property
        propertyType = propertyAccess.Type;

        // Build and return a lambda expression with the determined property type
        return Expression.Lambda(propertyAccess, parameter);
    }
















    public static IQueryable < IGrouping < TKey, T >> WhereAggregate<T, TKey>(
        this IQueryable < IGrouping < TKey, T >> source,
        string aggregateFunction,
        string propertyName,
        string comparisonOperator,
        double threshold)
    {
        // Build a strongly-typed lambda expression for the property selector
        var propertySelector = BuildLambdaExpression<T>(propertyName, out var propertyType);

        // Compile the property selector for direct invocation
        var compiledSelector = propertySelector.Compile();

        // Define the comparison function based on the operator
        Func < double, bool > condition = comparisonOperator switch
        {
            ">" => value => value > threshold,
            "<" => value => value < threshold,
            ">=" => value => value >= threshold,
            "<=" => value => value <= threshold,
            "==" => value => value == threshold,
            "!=" => value => value != threshold,
            _ => throw new ArgumentException("Invalid comparison operator")
        };

        // Apply the aggregate function using the strongly-typed lambda expression
        return aggregateFunction.ToLower() switch
        {
            "sum" => source.Where(group => condition(group.Select(compiledSelector).Sum(Convert.ToDouble))),
            "average" => source.Where(group => condition(group.Select(compiledSelector).Average(Convert.ToDouble))),
            "count" => source.Where(group => condition(group.Count())),
            "max" => source.Where(group => condition(Convert.ToDouble(group.Max(compiledSelector)))),
            "min" => source.Where(group => condition(Convert.ToDouble(group.Min(compiledSelector)))),
            _ => throw new ArgumentException("Invalid aggregate function")
        };
        }
    
    private static LambdaExpression BuildLambdaExpression<T>(string propertyName, out Type propertyType)
        {
            var parameter = Expression.Parameter(typeof (T), "x");
        Expression propertyAccess = parameter;

            // Traverse properties to handle nested properties
            foreach(var member in propertyName.Split('.'))
            {
                propertyAccess = Expression.PropertyOrField(propertyAccess, member);
            }

            // Set the property type based on the final resolved property
            propertyType = propertyAccess.Type;

            // Create a strongly-typed lambda expression based on the actual property type
            var delegateType = typeof (Func<,>).MakeGenericType(typeof (T), propertyType);
            return Expression.Lambda(delegateType, propertyAccess, parameter);
        }









        public static IQueryable < IGrouping < object, T >> GroupBy<T>(this IQueryable < T > source, string keySelector)
        {
            var keyExpression = BuildLambdaExpression<T>(keySelector);
            return source.GroupBy(keyExpression);
        }

private static Expression < Func < T, object >> BuildLambdaExpression<T>(string property)
        {
    ParameterExpression parameter = Expression.Parameter(typeof (T), "x");
    Expression propertyAccess = property.Split('.')
                .Aggregate((Expression)parameter, (acc, propName) => Expression.PropertyOrField(acc, propName));

            // Cast property access to object if the type is not already object
            if (propertyAccess.Type.IsValueType) {
                propertyAccess = Expression.Convert(propertyAccess, typeof (object));
            }

            return Expression.Lambda<Func<T, object>>(propertyAccess, parameter);
        }











        private Expression < Func < IGrouping<T, ActorSearchIndex>, bool >> BuildAggregateFunctionCheck<T>(
            IQueryable < IGrouping < T, ActorSearchIndex >> source,
            SearchCondition condition)
        {
            // Parse the condition value to double for comparison
            if (!double.TryParse(condition.Value, out double targetValue)) {
                throw new ArgumentException("Invalid value in condition.");
            }

            // Create parameter for lambda expression
            var parameter = Expression.Parameter(typeof (IGrouping<T, ActorSearchIndex>), "group");

            // Expression to calculate sum of ShareQty in each group
            var sumExpression = Expression.Call(
                typeof (Enumerable),
                "Sum",
                new Type[] { typeof(ActorSearchIndex) },
                parameter,
                Expression.Lambda<Func<ActorSearchIndex, double>>(Expression.PropertyOrField(Expression.Parameter(typeof (ActorSearchIndex), "a"), "ShareQty"), Expression.Parameter(typeof (ActorSearchIndex), "a"))
            );

            // Build the condition expression based on the enum value
            Expression conditionExpression = null;
            switch (condition.Condition) {
                case Condition.equal:
                    conditionExpression = Expression.Equal(sumExpression, Expression.Constant(targetValue));
                    break;
                case Condition.less:
                    conditionExpression = Expression.LessThan(sumExpression, Expression.Constant(targetValue));
                    break;
                case Condition.greater:
                    conditionExpression = Expression.GreaterThan(sumExpression, Expression.Constant(targetValue));
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            // Return lambda expression for filtering groups
            return Expression.Lambda<Func<IGrouping<T, ActorSearchIndex>, bool>>(conditionExpression, parameter);
        }






        using System;
        using System.Linq;
        using System.Linq.Expressions;
        using System.Reflection;

        public enum Condition {
            equal,
            less,
            greater
        }

        public class SearchCondition {
            public string Value { get; set; }
            public Condition Condition { get; set; }
    }

    public class ActorSearchIndex {
        public decimal? InitQty { get; set; }
            public double ? ShareQty { get; set; } // Nullable double
}
        
        private Expression < Func < IGrouping<T, ActorSearchIndex>, bool >> BuildAggregateFunctionCheck<T>(
    IQueryable < IGrouping < T, ActorSearchIndex >> source,
    SearchCondition condition,
    string propertyName)
{
    // Parse the condition value dynamically to support different numeric types
    if (!double.TryParse(condition.Value, out double targetValue)) {
        throw new ArgumentException("Invalid value in condition.");
    }

    // Get the specified property info from ActorSearchIndex based on propertyName
    var propertyInfo = typeof (ActorSearchIndex).GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
    if (propertyInfo == null) {
        throw new ArgumentException($"Property '{propertyName}' not found in ActorSearchIndex.");
    }

    // Validate the property type to be a nullable numeric type
    var propertyType = Nullable.GetUnderlyingType(propertyInfo.PropertyType) ?? propertyInfo.PropertyType;
    if (!typeof (IConvertible).IsAssignableFrom(propertyType)) {
        throw new ArgumentException("Property must be a nullable numeric type.");
    }

    // Create parameter for lambda expression
    var groupParameter = Expression.Parameter(typeof (IGrouping<T, ActorSearchIndex>), "group");

    // Create parameter for ActorSearchIndex items in the group
    var actorParameter = Expression.Parameter(typeof (ActorSearchIndex), "a");

    // Access the specified property on ActorSearchIndex
    var propertyAccess = Expression.Property(actorParameter, propertyInfo);

    // Cast the property access to double for comparison, handling nullable types
    var convertedPropertyAccess = Expression.Convert(propertyAccess, typeof (double ?));

    // Sum expression, summing the specified property within each group
    var sumExpression = Expression.Call(
        typeof (Enumerable),
        "Sum",
        new Type[] { typeof(ActorSearchIndex) },
        groupParameter,
        Expression.Lambda<Func<ActorSearchIndex, double?>>(
            convertedPropertyAccess,
            actorParameter
        )
    );

    // Convert the sum to double for comparison, handling nullable conversions
    var convertedSumExpression = Expression.Convert(sumExpression, typeof (double));

    // Target value for comparison as a double constant
    var targetValueExpression = Expression.Constant(targetValue, typeof (double));

            // Build the condition expression based on the enum value
            Expression conditionExpression = null;
    switch (condition.Condition) {
        case Condition.equal:
            conditionExpression = Expression.Equal(convertedSumExpression, targetValueExpression);
            break;
        case Condition.less:
            conditionExpression = Expression.LessThan(convertedSumExpression, targetValueExpression);
            break;
        case Condition.greater:
            conditionExpression = Expression.GreaterThan(convertedSumExpression, targetValueExpression);
            break;
        default:
            throw new ArgumentOutOfRangeException();
    }

    // Return lambda expression for filtering groups
    return Expression.Lambda<Func<IGrouping<T, ActorSearchIndex>, bool>>(conditionExpression, groupParameter);
}
