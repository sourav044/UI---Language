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
